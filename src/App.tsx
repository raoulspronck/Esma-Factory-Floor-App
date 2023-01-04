import { useState } from "react";
import InitialScreen from "./pages/InitialScreen";
import MonitorExaliseScreen from "./pages/MonitorExaliseScreen";
import MonitorScreen from "./pages/MonitorScreen";
import ReceiveFile from "./pages/ReceiveFile";
import SendFile from "./pages/SendFile";

// 4 pages -> send file / receive file / monitor / Exalise monitor

function App() {
  const [screen, setScreen] = useState<
    "Initial" | "SendFile" | "ReceiveFile" | "Monitor" | "ExaliseMonitor"
  >("Initial");

  switch (screen) {
    case "Initial":
      return <InitialScreen setScreen={setScreen} />;

    case "Monitor":
      return <MonitorScreen setScreen={setScreen} />;

    case "ExaliseMonitor":
      return <MonitorExaliseScreen setScreen={setScreen} />;

    case "SendFile":
      return <SendFile setScreen={setScreen} />;

    case "ReceiveFile":
      return <ReceiveFile setScreen={setScreen} />;

    default:
      return <InitialScreen setScreen={setScreen} />;
  }
}

export default App;
