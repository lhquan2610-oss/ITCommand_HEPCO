using System;
using System.Collections.Concurrent;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

class DahuaBridge {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public struct NET_DEVICEINFO_Ex {
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 48)]
        public byte[] sSerialNumber;
        public int nAlarmInPortNum;
        public int nAlarmOutPortNum;
        public int nDiskNum;
        public int nDVRType;
        public int nChanNum;
        public byte byLimitLoginTime;
        public byte byLeftLogTimes;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 2)]
        public byte[] bReserved;
        public int nLockLeftTime;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 24)]
        public byte[] Reserved;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public struct NET_IN_LOGIN_WITH_HIGHLEVEL_SECURITY {
        public uint dwSize;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)]
        public string szIP;
        public int nPort;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)]
        public string szUserName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)]
        public string szPassword;
        public int emSpecCap;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
        public byte[] byReserved;
        public IntPtr pCapParam;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public struct NET_OUT_LOGIN_WITH_HIGHLEVEL_SECURITY {
        public uint dwSize;
        public NET_DEVICEINFO_Ex stuDeviceInfo;
        public int nError;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 132)]
        public byte[] byReserved;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct SNAP_PARAMS {
        public uint Channel;
        public uint Quality;
        public uint ImageSize;
        public uint mode;
        public uint InterSnap;
        public uint CmdSerial;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
        public uint[] Reserved;
    }

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    public delegate void fSnapRev(IntPtr lLoginID, IntPtr pBuf, uint RevLen, uint EncodeType, uint CmdSerial, IntPtr dwUser);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool SetDllDirectory(string lpPathName);

    [DllImport("dhnetsdk.dll")]
    public static extern bool CLIENT_Init(IntPtr cbDisConnect, IntPtr dwUser);

    [DllImport("dhnetsdk.dll")]
    public static extern void CLIENT_Cleanup();

    [DllImport("dhnetsdk.dll")]
    public static extern IntPtr CLIENT_LoginWithHighLevelSecurity(
        ref NET_IN_LOGIN_WITH_HIGHLEVEL_SECURITY pInParam,
        ref NET_OUT_LOGIN_WITH_HIGHLEVEL_SECURITY pOutParam
    );

    [DllImport("dhnetsdk.dll")]
    public static extern void CLIENT_SetSnapRevCallBack(fSnapRev OnSnapRevMessage, IntPtr dwUser);

    [DllImport("dhnetsdk.dll")]
    public static extern bool CLIENT_SnapPictureEx(IntPtr lLoginID, ref SNAP_PARAMS par, IntPtr reserved);

    [DllImport("dhnetsdk.dll")]
    public static extern bool CLIENT_Logout(IntPtr lLoginID);

    [DllImport("dhnetsdk.dll")]
    public static extern uint CLIENT_GetLastError();

    class PendingSnap {
        public ManualResetEvent Evt = new ManualResetEvent(false);
        public byte[] Data = null;
    }

    static ConcurrentDictionary<uint, PendingSnap> pendingSnaps = new ConcurrentDictionary<uint, PendingSnap>();
    static IntPtr loginId = IntPtr.Zero;
    static string currentIp = "113.161.8.149";
    static int currentPort = 37777;
    static string currentUser = "admin";
    static string currentPass = "philonghue123";
    static uint serialCounter = 100;
    static fSnapRev snapCallback;

    static void OnSnap(IntPtr lLoginID, IntPtr pBuf, uint RevLen, uint EncodeType, uint CmdSerial, IntPtr dwUser) {
        if (RevLen > 0 && pBuf != IntPtr.Zero) {
            byte[] buf = new byte[RevLen];
            Marshal.Copy(pBuf, buf, 0, (int)RevLen);
            PendingSnap ps;
            if (pendingSnaps.TryGetValue(CmdSerial, out ps)) {
                ps.Data = buf;
                ps.Evt.Set();
            }
        }
    }

    static bool EnsureLoggedIn() {
        if (loginId != IntPtr.Zero) return true;
        var inParam = new NET_IN_LOGIN_WITH_HIGHLEVEL_SECURITY();
        inParam.dwSize = (uint)Marshal.SizeOf(typeof(NET_IN_LOGIN_WITH_HIGHLEVEL_SECURITY));
        inParam.szIP = currentIp;
        inParam.nPort = currentPort;
        inParam.szUserName = currentUser;
        inParam.szPassword = currentPass;
        inParam.emSpecCap = 0;

        var outParam = new NET_OUT_LOGIN_WITH_HIGHLEVEL_SECURITY();
        outParam.dwSize = (uint)Marshal.SizeOf(typeof(NET_OUT_LOGIN_WITH_HIGHLEVEL_SECURITY));

        loginId = CLIENT_LoginWithHighLevelSecurity(ref inParam, ref outParam);
        return loginId != IntPtr.Zero;
    }

    static void Main(string[] args) {
        string exeDir = AppDomain.CurrentDomain.BaseDirectory;
        string smartPssDir = @"C:\Program Files\Smart Professional Surveillance System\SmartPSS";
        if (File.Exists(Path.Combine(exeDir, "dhnetsdk.dll"))) {
            SetDllDirectory(exeDir);
            Environment.CurrentDirectory = exeDir;
        } else if (Directory.Exists(smartPssDir)) {
            SetDllDirectory(smartPssDir);
            Environment.CurrentDirectory = smartPssDir;
        }

        try {
            CLIENT_Init(IntPtr.Zero, IntPtr.Zero);
            snapCallback = new fSnapRev(OnSnap);
            CLIENT_SetSnapRevCallBack(snapCallback, IntPtr.Zero);
        } catch (Exception ex) {
            Console.WriteLine("{\"type\":\"init_error\",\"error\":\"" + ex.Message.Replace("\"", "'") + "\"}");
            Console.Out.Flush();
            return;
        }

        Console.WriteLine("{\"type\":\"ready\"}");
        Console.Out.Flush();

        string line;
        while ((line = Console.ReadLine()) != null) {
            line = line.Trim();
            if (string.IsNullOrEmpty(line)) continue;
            if (line.Equals("QUIT", StringComparison.OrdinalIgnoreCase)) break;

            if (line.StartsWith("SNAP", StringComparison.OrdinalIgnoreCase)) {
                string[] parts = line.Split(' ');
                uint ch = 0;
                if (parts.Length > 1) uint.TryParse(parts[1], out ch);

                if (!EnsureLoggedIn()) {
                    Console.WriteLine("{\"type\":\"snap\",\"channel\":" + ch + ",\"success\":false,\"error\":\"Login failed\"}");
                    Console.Out.Flush();
                    continue;
                }

                uint serial = ++serialCounter;
                var ps = new PendingSnap();
                pendingSnaps[serial] = ps;

                var sp = new SNAP_PARAMS();
                sp.Channel = ch;
                sp.Quality = 4;
                sp.ImageSize = 1;
                sp.mode = 0;
                sp.InterSnap = 0;
                sp.CmdSerial = serial;
                sp.Reserved = new uint[4];

                bool ok = CLIENT_SnapPictureEx(loginId, ref sp, IntPtr.Zero);
                if (!ok) {
                    // Re-login once if session dropped
                    CLIENT_Logout(loginId);
                    loginId = IntPtr.Zero;
                    if (EnsureLoggedIn()) {
                        ok = CLIENT_SnapPictureEx(loginId, ref sp, IntPtr.Zero);
                    }
                }

                if (ok && ps.Evt.WaitOne(2800) && ps.Data != null && ps.Data.Length > 0) {
                    string b64 = Convert.ToBase64String(ps.Data);
                    Console.WriteLine("{\"type\":\"snap\",\"channel\":" + ch + ",\"success\":true,\"dataUrl\":\"data:image/jpeg;base64," + b64 + "\"}");
                } else {
                    Console.WriteLine("{\"type\":\"snap\",\"channel\":" + ch + ",\"success\":false,\"error\":\"Timeout or offline channel\"}");
                }
                Console.Out.Flush();
                PendingSnap removed;
                pendingSnaps.TryRemove(serial, out removed);
            }
        }

        if (loginId != IntPtr.Zero) CLIENT_Logout(loginId);
        CLIENT_Cleanup();
        GC.KeepAlive(snapCallback);
    }
}
