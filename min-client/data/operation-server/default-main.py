#!/usr/bin/env python3
from multiprocessing import Lock

import aiohttp
import sys
import os
import importlib
from nicegui import ui, app

sys.path.append("./operations")
#print(operations.__all__)

#for tests
#a = 0
#while a < 1000:
#    for s in operations.__all__:
#        exec(f"operations.{s}.init(\"/{a}\")")
#        a+=1

tab_index = 0
lock = Lock()

tabs_db = {}

@app.get("/shutdown")
def shutdown_server():
    print("Shutting down server...")
    app.shutdown()
    return {"message": "Server shutdown initiated"}

@app.post("/{s}")
def add(s: str):
    print()
    if os.path.exists(f"operations/{s}") or os.path.exists(f"operations/{s}.py"):
        global tab_index, lock
        lock.acquire()
        try:
            with tabs:
                tabb = ui.tab(f"{s}-{tab_index}", label=f"{s}-{tab_index}")
            with panels:
                with ui.tab_panel(f"{s}-{tab_index}") as panell:
                    if s in sys.modules.keys():
                        importlib.reload(sys.modules[s])
                        module = sys.modules[s]
                    else:
                        module = __import__(s)
                    module.init()
            tabs_db[f"{s}-{tab_index}"] = {"tab": tabb, "panel": panell}
            tt = f"{s}-{tab_index}"
            tab_index+=1
            return {"success": f"{tt}"}
        except Exception as e:
            print(e)
            return {"error": f"{e}"}
        finally:
            lock.release()
    return {"error": f"module {s} not found in 'operations' folder"}

@app.delete("/{s}")
def delete(s: str):
    global lock
    lock.acquire()
    if s in tabs_db:
        tabs_db[s]["panel"].delete()
        tabs_db[s]["tab"].delete()
    lock.release()

@app.get("/{s}")
def switch(s: str):
    global lock
    lock.acquire()
    if s in tabs_db:
        tabs.set_value(s)
    lock.release()

async def add_tab(t):
    url = f"http://127.0.0.1:8000/{t}"
    print(url)
    async with aiohttp.ClientSession() as session:
        async with  session.post(url, data ={}) as response:
            data = await response.text()
            print (data)

async def rm_tab(t):
    url = f"http://127.0.0.1:8000/{t}"
    print(url)
    async with aiohttp.ClientSession() as session:
        async with  session.delete(url, data ={}) as response:
            data = await response.text()
            print (data)

tabs = ui.tabs().classes('q1-tabs')
panels = ui.tab_panels(tabs).classes('q1-tabPanels')

ui.input(label='tab name', placeholder='start typing',
         on_change=lambda e: result.set_text(e.value)).classes('q1-tabInput')
result = ui.label().classes('q1-tabInputLabel')
ui.button('Add Tab', on_click=lambda: add_tab(result.text)).classes('q1-addTabButton')
ui.button('Rem Tab', on_click=lambda: rm_tab(result.text)).classes('q1-removeTabButton')

ui.run(port=8000, storage_secret='secret', show = False, reload=False)
