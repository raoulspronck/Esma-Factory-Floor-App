import { animated, useSprings } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import clamp from "lodash.clamp";
import { useEffect, useRef, useState } from "react";

import { Flex, Link, Text } from "@chakra-ui/react";

import ConfigurableDashboard from "./pages/ConfigurableDashboard";
import RS232Monitor from "./pages/RS232Monitor";
import TaskBar from "./pages/TaskBar";

import { invoke } from "@tauri-apps/api";
import styles from "./styles.module.css";
import useWindowSize from "./utils/useWindowSize";

import { onUpdaterEvent } from "@tauri-apps/api/updater";

function App() {
  const [page, setPage] = useState(0);
  const [exaliseStatus, setExaliseStatus] = useState("disconnected");
  const [error, setError] = useState("");
  const [layoutChangable, setlayoutChangable] = useState(false);
  const [login, setLogin] = useState(false);
  const [dashboard, setDashboard] = useState({
    layout: [],
    devices: [] as any[],
  });
  const { height } = useWindowSize();

  useEffect(() => {
    invoke("close_splashscreen");

    onUpdaterEvent(({ error, status }) => {
      invoke("write_to_log_file", {
        data: `${status + " / " + error} \r\n`,
      });
    });
  }, []);

  return (
    <>
      <Flex
        height={"100vh"}
        width="100vw"
        bgColor={"gray.50"}
        flexDir="column"
        position={"relative"}
        color="gray.800"
      >
        <TaskBar
          login={login}
          dashboard={dashboard}
          setDashboard={setDashboard}
          setLogin={setLogin}
          setlayoutChangable={setlayoutChangable}
          exaliseStatus={exaliseStatus}
          setExaliseStatus={setExaliseStatus}
          error={error}
          setError={setError}
          page={page}
        />
        <div className="flex fill center">
          <Viewpager
            changingLayout={layoutChangable}
            setPage={setPage}
            pages={[
              <ConfigurableDashboard
                dashboard={dashboard}
                layoutChangable={layoutChangable}
                setDashboard={setDashboard}
                setlayoutChangable={setlayoutChangable}
                login={login}
              />,
              /*  <PDFViewer />,
              <AllOrders />, */
              <RS232Monitor setError={setError} />,
            ]}
          />
        </div>
        {error !== "" && page === 1 ? (
          <Flex
            width={"100%"}
            height={`70px`}
            position="absolute"
            top={height - 0.04 * height - 70}
            justifyContent="center"
          >
            <Flex
              height={"100%"}
              width={["250px", "300px", "400px"]}
              backgroundColor={"red"}
              color="white"
              justifyContent={"center"}
              alignItems="center"
              borderRadius={["12px", "16px", "20px"]}
              fontSize={["12px", "16px", "20px"]}
              fontWeight={"medium"}
              p="5"
            >
              {error === "Thread already started" ? (
                <Flex alignItems={"center"} flexDir="column">
                  <Text>{error}</Text>

                  <Link
                    fontSize={["9px", "12px", "14px"]}
                    onClick={() => {
                      invoke("stop_rs232");
                    }}
                  >
                    Click here to force all threads to stop
                  </Link>
                </Flex>
              ) : (
                error
              )}
            </Flex>
          </Flex>
        ) : null}{" "}
      </Flex>
    </>
  );
}

interface ViewpagerInterface {
  pages: any[];
  setPage: React.Dispatch<React.SetStateAction<number>>;
  changingLayout: boolean;
}

const Viewpager: React.FC<ViewpagerInterface> = ({
  pages,
  setPage,
  changingLayout,
}) => {
  const index = useRef(0);
  const width = window.innerWidth;

  const [props, api] = useSprings(pages.length, (i) => ({
    x: i * width,
    scale: 1,
    display: "block",
  }));
  const bind: any = useDrag(
    ({ active, movement: [mx], direction: [xDir], cancel }) => {
      if (changingLayout) {
        return;
      }

      if (active && Math.abs(mx) > width / 4) {
        index.current = clamp(
          index.current + (xDir > 0 ? -1 : 1),
          0,
          pages.length - 1
        );
        cancel();
      }

      api.start((i) => {
        if (i < index.current - 1 || i > index.current + 1) {
          return { display: "none" };
        }
        const x = (i - index.current) * width + (active ? mx : 0);
        const scale = active ? 1 - Math.abs(mx) / width / 4 : 1;
        return { x, scale, display: "block" };
      });

      setPage(index.current);
    }
  );
  return (
    <div className={styles.wrapper}>
      {props.map(({ x, display, scale }, i) => (
        <animated.div
          className={styles.page}
          {...bind()}
          key={i}
          style={{ display, x }}
        >
          <animated.div style={{ scale }}>{pages[i]}</animated.div>
        </animated.div>
      ))}
    </div>
  );
};

export default App;
