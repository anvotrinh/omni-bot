using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;
using System.Windows.Forms;


namespace Step
{
    internal class Program
    {
        public static string v_appName = "Step";
        public static string v_version = "v1.7";
        // Placeholder to specify the parent window's title text. 
        // To be used in both Command 1 & 2, after the task is completed and ParentWindow needs to get focus back and be activated.
        public static string v_ParentWindowTitleText = "Qute";
        [DllImport("user32.dll")]
        private static extern bool PostMessage(IntPtr hWnd, uint Msg, int wParam, int lParam);

        [DllImport("user32.dll")]

        private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo);


        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        public const int KEYEVENTF_KEYDOWN = 0x0000; // New definition
        public const int KEYEVENTF_EXTENDEDKEY = 0x0001; //Key down flag
        public const int KEYEVENTF_KEYUP = 0x0002; //Key up flag
        const int WM_KEYDOWN = 0x0100;
        const int WM_KEYUP = 0x0101;
        const int VK_CONTROL = 0x11;
        const int VK_MENU = 0x12;
        const int VK_C = 0x43;
        const int VK_S = 0x53;
        const int VK_V = 0x56;
        const int VK_2 = 0x32;
        [DllImport("user32.dll")]
        static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

        [DllImport("user32.dll")]
        static extern IntPtr GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

        [DllImport("user32.dll")]
        static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, StringBuilder lParam);

        const int WM_GETTEXT = 0x000D;
        const int WM_GETTEXTLENGTH = 0x000E;

        [STAThread]
        static void Main(string[] args)
        {
            HotKeyManager.RegisterHotKey(Keys.D2, KeyModifiers.Alt);
            HotKeyManager.HotKeyPressed += new EventHandler<HotKeyEventArgs>(HotKeyManager_HotKeyPressed);
            Console.SetIn(new StreamReader(Console.OpenStandardInput(8192))); // This will allow input >256 chars
            while (true)//(Console.In.Peek() != -1)
            {
                string input = Console.In.ReadLine();
                //Thread.Sleep(100);
                String line = input;
                if (!line.Trim(' ').Equals(""))
                {
                    /*
                        To Print the version and app name: {"Command_ID": 3, "Command_Parameter": ""}
                        To Do Command 1: 
                            Either stdin the follwoing text: {"Command_ID": 1, "Command_Parameter": ""}
                            Or, press Alt+2 HotKey.
                        To Do Command 2: {"Command_ID": 2, "Command_Parameter": "Hello World"} ( will print Line Command 2 Executed. when task completed.)
                        To Exit the application: {"Command_ID": 0, "Command_Parameter": ""}                     
                     */
                    if (line.Equals("{\"Command_ID\": 0, \"Command_Parameter\": \"\"}"))
                        Environment.Exit(0);
                    if (line.Equals("{\"Command_ID\": 3, \"Command_Parameter\": \"\"}"))
                        Console.WriteLine(v_appName + " " + v_version);
                    else if (line.StartsWith("{\"Command_ID\": 1,"))
                    {//Step1
                        Thread.Sleep(2000);
                        string v_titlewindow = fn_gettxt();
                        if (!v_titlewindow.Equals("No focused window found.") && !v_titlewindow.Equals("No text selected in the focused window."))
                        {
                            IntPtr targetWindow = FindWindow(null, v_titlewindow);

                            IntPtr SelfWindow = FindWindow(null, Console.Title);
                            if (targetWindow != IntPtr.Zero && !targetWindow.Equals(SelfWindow))
                            {
                                SetForegroundWindow(targetWindow);
                                const int KEYEVENTF_KEYUP = 0x0002;
                                clearclipboard();
                                Thread.Sleep(50);
                                keybd_event(VK_CONTROL, 0, WM_KEYDOWN, IntPtr.Zero);
                                keybd_event(VK_C, 0, WM_KEYDOWN, IntPtr.Zero);

                                keybd_event(VK_C, 0, KEYEVENTF_KEYUP, IntPtr.Zero);
                                keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, IntPtr.Zero);

                                string copiedText = GetText();
                                Console.Write(copiedText + Environment.NewLine);
                                //need to give windows a chance to complete Console.Write before active window focus is changed.
                                Thread.Sleep(100);
                                //Code to setfocus of defined (v_WindowtitleText) Window.  
                                IntPtr v_ParentTargetWindow = FindWindow(null, v_ParentWindowTitleText);
                                if (v_ParentTargetWindow != IntPtr.Zero)
                                {
                                    /* Argument 9 for ShowWindow: Activates and displays the window. If the window is minimized, maximized, or arranged, 
                                     * the system restores it to its original size and position. An application should specify this flag 
                                     * when restoring a minimized window.
                                     */
                                    ShowWindow(v_ParentTargetWindow, 9);
                                    SetForegroundWindow(v_ParentTargetWindow);
                                }
                            }
                            else
                            {
                            }

                        }
                    }
                    else if (line.StartsWith("{\"Command_ID\": 2,"))
                    {
                        //Thread.Sleep(100);
                        //Step2
                        string v_titlewindow = fn_gettxt();
                        if (!v_titlewindow.Equals("No focused window found.") && !v_titlewindow.Equals("No text selected in the focused window."))
                        {
                            IntPtr targetWindow = FindWindow(null, v_titlewindow);
                            IntPtr SelfWindow = FindWindow(null, Console.Title);
                            if (targetWindow != IntPtr.Zero && !targetWindow.Equals(SelfWindow))
                            {
                                //"}
                                string v_str = line.Replace("{\"Command_ID\": 2, \"Command_Parameter\": \"", "").Replace("\"}", "");
                                System.Windows.Forms.Clipboard.SetText(v_str);
                                SetForegroundWindow(targetWindow);
                                const int KEYEVENTF_KEYUP = 0x0002;
                                Thread.Sleep(100);
                                keybd_event(VK_CONTROL, 0, WM_KEYDOWN, IntPtr.Zero);
                                keybd_event(VK_V, 0, WM_KEYDOWN, IntPtr.Zero);
                                keybd_event(VK_V, 0, KEYEVENTF_KEYUP, IntPtr.Zero);
                                keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, IntPtr.Zero);
                                //Console.WriteLine("Command 2 Executed.");
                                //need to give windows a chance to complete copy before focus is active window is changed.
                                //Thread.Sleep(100);
                                //Code to setfocus of defined (v_WindowtitleText) Window.  
                                //IntPtr v_ParentTargetWindow = FindWindow(null, v_ParentWindowTitleText);
                                //if (v_ParentTargetWindow != IntPtr.Zero)
                                //{
                                //    /* Argument 9 for ShowWindow: Activates and displays the window. If the window is minimized, maximized, or arranged, 
                                //    * the system restores it to its original size and position. An application should specify this flag 
                                //    * when restoring a minimized window.
                                //    */
                                //    ShowWindow(v_ParentTargetWindow, 9);
                                //    SetForegroundWindow(v_ParentTargetWindow);
                                //}
                            }
                            else
                            {
                                //Console.WriteLine("Target window not found.");
                            }
                        }

                    }

                }
            }
        }

        [DllImport("User32.dll")]
        public static extern short GetAsyncKeyState(Int32 vKey);
        //private static bool isSearchRunning = false;
        static void HotKeyManager_HotKeyPressed(object sender, HotKeyEventArgs e)
        {
            long D2AsyncKeyState = GetAsyncKeyState(VK_2);
            long AltAsyncKeyState = GetAsyncKeyState(VK_MENU);
            //Console.WriteLine("AltAsyncKeyState: " + AltAsyncKeyState.ToString() + ", D2AsyncKeyState: " + D2AsyncKeyState.ToString());
            while ((AltAsyncKeyState == -32767 || AltAsyncKeyState == -32768) || (D2AsyncKeyState == -32767 || D2AsyncKeyState == -32768))
            {
                //Console.WriteLine("In Loop: AltAsyncKeyState: " + AltAsyncKeyState.ToString() + ", D2AsyncKeyState: " + D2AsyncKeyState.ToString());
                AltAsyncKeyState = GetAsyncKeyState(VK_MENU);
                D2AsyncKeyState = GetAsyncKeyState(VK_2);
            }
            //Console.WriteLine("Finally: AltAsyncKeyState: " + AltAsyncKeyState.ToString() + ", D2AsyncKeyState: " + D2AsyncKeyState.ToString());
            //Thread.Sleep(100);
            fn_ProcessCommand1();
        }
        public static void fn_ProcessCommand1()
        {
            //Step1 via HotKeys
            string v_titlewindow = fn_gettxt();
            if ( !v_titlewindow.Equals(v_ParentWindowTitleText) && !v_titlewindow.Equals("No focused window found.") && !v_titlewindow.Equals("No text selected in the focused window."))
            {
                IntPtr targetWindow = FindWindow(null, v_titlewindow);

                IntPtr SelfWindow = FindWindow(null, Console.Title);
                if (targetWindow != IntPtr.Zero && !targetWindow.Equals(SelfWindow))
                {
                    //SetForegroundWindow(targetWindow);
                    const int KEYEVENTF_KEYUP = 0x0002;
                    clearclipboard();
                    //Thread.Sleep(50);
                    long D2AsyncKeyState = GetAsyncKeyState(VK_2);
                    if (D2AsyncKeyState == -32767 || D2AsyncKeyState == -32768)
                    {
                        keybd_event(VK_2, 0, KEYEVENTF_KEYUP, IntPtr.Zero);
                        D2AsyncKeyState = GetAsyncKeyState(VK_2);
                    }
                    long AltAsyncKeyState = GetAsyncKeyState(VK_MENU);
                    if (AltAsyncKeyState == -32767 || AltAsyncKeyState == -32768)
                    {
                        keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, IntPtr.Zero);
                        AltAsyncKeyState = GetAsyncKeyState(VK_MENU);
                    }
                    //Thread.Sleep(1000);
                    SendKeys.Send("%0");

                    keybd_event(VK_CONTROL, 0x1D, KEYEVENTF_EXTENDEDKEY | 0, IntPtr.Zero);
                    keybd_event(VK_C, 0x2F, KEYEVENTF_EXTENDEDKEY | 0, IntPtr.Zero);
                    Thread.Sleep(50);
                    keybd_event(VK_C, 0x2F, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, IntPtr.Zero);
                    keybd_event(VK_CONTROL, 0x1D, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, IntPtr.Zero);

                    string copiedText = GetText();
                    if (!copiedText.Equals(""))
                    {
                        Console.Write(copiedText + Environment.NewLine);
                        //Code to setfocus of defined (v_WindowtitleText) Window.  
                        IntPtr v_ParentTargetWindow = FindWindow(null, v_ParentWindowTitleText);
                        if (v_ParentTargetWindow != IntPtr.Zero)
                        {
                            /* Argument 9 for ShowWindow: Activates and displays the window. If the window is minimized, maximized, or arranged, 
                             * the system restores it to its original size and position. An application should specify this flag 
                             * when restoring a minimized window.
                             */
                            ShowWindow(v_ParentTargetWindow, 9);
                            SetForegroundWindow(v_ParentTargetWindow);
                        }
                    }
                }
                else
                {
                }

            }
        }
        public static string GetText()
        {
            string ReturnValue = string.Empty;
            Thread STAThread = new Thread(
                delegate ()
                {
                    // Use a fully qualified name for Clipboard otherwise it
                    // will end up calling itself.
                    ReturnValue = System.Windows.Forms.Clipboard.GetText();
                });
            STAThread.SetApartmentState(ApartmentState.STA);
            STAThread.Start();
            STAThread.Join();
            return ReturnValue;
        }
        public static void clearclipboard()
        {
            Thread STAThread = new Thread(
                delegate ()
                {
                    System.Windows.Forms.Clipboard.Clear();
                });
            STAThread.SetApartmentState(ApartmentState.STA);
            STAThread.Start();
            STAThread.Join();
        }

        public static string fn_gettxt()
        {
            string returnedtxt = "";
            IntPtr foregroundWindow = GetForegroundWindow();
            uint processId;
            GetWindowThreadProcessId(foregroundWindow, out processId);

            if (foregroundWindow != IntPtr.Zero)
            {
                int length = SendMessage(foregroundWindow, WM_GETTEXTLENGTH, 0, null);
                if (length > 0)
                {
                    StringBuilder sb = new StringBuilder(length + 1);
                    SendMessage(foregroundWindow, WM_GETTEXT, sb.Capacity, sb);

                    string selectedText = sb.ToString();
                    returnedtxt = selectedText;
                }
                else
                {
                    //Console.WriteLine("No text selected in the focused window.");
                }
            }
            else
            {
                //Console.WriteLine("No focused window found.");
            }
            return returnedtxt;
        }
    }
}
