import { useEffect, useRef } from "react";
import { Flex } from "@chakra-ui/react";

import ConfigurableDashboard from "./pages/ConfigurableDashboard";
import TaskBar from "./pages/TaskBar";
import EventManager from "./components/EventManager";
import ShutdownCountdownDialog from "./components/ShutdownCountdownDialog";

import { invoke } from "@tauri-apps/api";
import { enable } from "tauri-plugin-autostart-api";

import { useDashboardStore } from "./stores/dashboardStore";
import { useSettingsStore } from "./stores/settingsStore";

function App() {
  const loadDashboard = useDashboardStore((s) => s.loadDashboard);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const init = async () => {
        enable().catch(console.error);
        await Promise.all([loadDashboard(), loadSettings()]);
        await invoke("close_splashscreen");
      };
      init().catch(console.error);
    }
  }, [loadDashboard, loadSettings]);

  return (
    <Flex
      height="100vh"
      width="100vw"
      bgColor="gray.100"
      flexDir="column"
      position="relative"
      color="gray.800"
    >
      {/* Mounts once; owns all Tauri event subscriptions */}
      <EventManager />
      <ShutdownCountdownDialog />

      <TaskBar />

      <div className="flex fill center">
        <ConfigurableDashboard />
      </div>
    </Flex>
  );
}

export default App;
