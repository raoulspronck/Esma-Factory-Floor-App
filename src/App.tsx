import { useEffect, useRef } from "react";
import { Flex } from "@chakra-ui/react";

import ConfigurableDashboard from "./pages/ConfigurableDashboard";
import TaskBar from "./pages/TaskBar";
import EventManager from "./components/EventManager";
import ShutdownCountdownDialog from "./components/ShutdownCountdownDialog";

import { invoke } from "@tauri-apps/api";
import { checkUpdate, installUpdate } from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";
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

        // Local disk reads only - get the dashboard on screen first, then open
        // the window. Nothing here touches the network.
        await Promise.all([loadDashboard(), loadSettings()]);
        await invoke("close_splashscreen");

        // The update check runs AFTER the app is usable, not before. It used to
        // gate all of the above: on slow shop-floor wifi its network call held
        // the splashscreen (and the dashboard load, and EventManager's real
        // hydration pass) for as long as it took to resolve or fail. An update
        // still installs and relaunches immediately when one is found - the
        // operator just isn't made to stare at a splashscreen while we ask.
        try {
          const { shouldUpdate } = await checkUpdate();
          if (shouldUpdate) {
            console.log("Update found, installing and relaunching...");
            await installUpdate();
            await relaunch();
          }
        } catch (err) {
          console.error("Update check failed", err);
        }
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
