import { animated, useSprings } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import clamp from "lodash.clamp";
import { useEffect, useRef } from "react";
import { Flex } from "@chakra-ui/react";

import ConfigurableDashboard from "./pages/ConfigurableDashboard";
import RS232Monitor from "./pages/RS232Monitor";
import TaskBar from "./pages/TaskBar";
import EventManager from "./components/EventManager";
import ShutdownCountdownDialog from "./components/ShutdownCountdownDialog";

import { invoke } from "@tauri-apps/api";
import { enable } from "tauri-plugin-autostart-api";

import { useDashboardStore } from "./stores/dashboardStore";
import { useConnectionStore } from "./stores/connectionStore";
import { useSettingsStore } from "./stores/settingsStore";

import styles from "./styles.module.css";
import useWindowSize from "./utils/useWindowSize";

function App() {
  const loadDashboard = useDashboardStore((s) => s.loadDashboard);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const rs232Error = useConnectionStore((s) => s.rs232Error);

  const { height } = useWindowSize();
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
      bgColor="gray.50"
      flexDir="column"
      position="relative"
      color="gray.800"
    >
      {/* Mounts once; owns all Tauri event subscriptions */}
      <EventManager />
      <ShutdownCountdownDialog />

      <TaskBar />

      <div className="flex fill center">
        <Viewpager
          pages={[<ConfigurableDashboard />, <RS232Monitor />]}
        />
      </div>

      {rs232Error && (
        <Flex
          width="100%"
          height="70px"
          position="absolute"
          top={height - 0.04 * height - 70}
          justifyContent="center"
        >
          <Flex
            height="100%"
            width={["250px", "300px", "400px"]}
            backgroundColor="red"
            color="white"
            justifyContent="center"
            alignItems="center"
            borderRadius={["12px", "16px", "20px"]}
            fontSize={["12px", "16px", "20px"]}
            fontWeight="medium"
            p="5"
          >
            {rs232Error}
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}

interface ViewpagerProps {
  pages: React.ReactNode[];
}

const Viewpager: React.FC<ViewpagerProps> = ({ pages }) => {
  const index = useRef(0);
  const width = window.innerWidth;

  const [props, api] = useSprings(pages.length, (i) => ({
    x: i * width,
    scale: 1,
    display: "block",
  }));

  const bind: any = useDrag(({ active, movement: [mx], direction: [xDir], cancel }) => {
    if (active && Math.abs(mx) > width / 4) {
      index.current = clamp(index.current + (xDir > 0 ? -1 : 1), 0, pages.length - 1);
      cancel();
    }
    api.start((i) => {
      if (i < index.current - 1 || i > index.current + 1) return { display: "none" };
      const x = (i - index.current) * width + (active ? mx : 0);
      const scale = active ? 1 - Math.abs(mx) / width / 4 : 1;
      return { x, scale, display: "block" };
    });
  });

  return (
    <div className={styles.wrapper}>
      {props.map(({ x, display, scale }, i) => (
        <animated.div className={styles.page} {...bind()} key={i} style={{ display, x }}>
          <animated.div style={{ scale }}>{pages[i]}</animated.div>
        </animated.div>
      ))}
    </div>
  );
};

export default App;
