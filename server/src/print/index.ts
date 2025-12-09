import os from "os";

/**
 * 打印服务器启动信息，包括监听地址和本机IP地址
 * @param host 服务器监听的主机地址
 * @param port 服务器监听的端口
 */
export function printServerInfo(port: number): void {
  // 获取本机IP地址（IPv4 / IPv6）
  const interfaces = os.networkInterfaces();
  const localIPs: { family: string; address: string }[] = [];

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;

    for (const addr of iface) {
      // 获取 IPv4 与 IPv6，排除内部地址
      if (!addr.internal && (addr.family === "IPv4" || addr.family === "IPv6")) {
        localIPs.push({ family: addr.family, address: addr.address });
      }
    }
  }

  // 打印本机IP地址
  if (localIPs.length > 0) {
    console.log("\nLocal network IP addresses:");
    console.log(`  - http://localhost:${port}`);
    localIPs.forEach((ip) => {
      const protocol = "http";
      if (ip.family === "IPv6") {
        console.log(`  - ${protocol}://[${ip.address}]:${port}`);
      } else {
        console.log(`  - ${protocol}://${ip.address}:${port}`);
      }
    });
  }
}

