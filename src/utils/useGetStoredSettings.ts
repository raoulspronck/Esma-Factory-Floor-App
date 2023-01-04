import { Store } from "tauri-plugin-store-api";

const useGetStoredSettings = (): {
  port: string;
  dataBits: string;
  stopBits: string;
  parity: string;
  baudRate: string;
  mqttKey: string;
  mqttSecret: string;
  deviceKey: string;
} => {
  let port = "";
  let dataBits = "";
  let stopBits = "";
  let parity = "";
  let baudRate = "";
  let mqttKey = "";
  let mqttSecret = "";
  let deviceKey = "";

  const store = new Store(".settings.dat");

  store
    .get("port")
    .then((e: any) =>
      typeof e === "string"
        ? (port = e)
        : e === null
        ? null
        : (port = JSON.stringify(e))
    )
    .catch((_e) => null);

  store
    .get("dataBits")
    .then((e: any) =>
      typeof e === "string"
        ? (dataBits = e)
        : e === null
        ? null
        : (dataBits = JSON.stringify(e))
    )
    .catch((_e) => null);

  store
    .get("stopBits")
    .then((e: any) =>
      typeof e === "string"
        ? (stopBits = e)
        : e === null
        ? null
        : (stopBits = JSON.stringify(e))
    )
    .catch((_e) => null);

  store
    .get("parity")
    .then((e: any) =>
      typeof e === "string"
        ? (parity = e)
        : e === null
        ? null
        : (parity = JSON.stringify(e))
    )
    .catch((_e) => null);

  store
    .get("baudRate")
    .then((e: any) =>
      typeof e === "string"
        ? (baudRate = e)
        : e === null
        ? null
        : (baudRate = JSON.stringify(e))
    )
    .catch((_e) => null);

  store
    .get("mqttKey")
    .then((e: any) =>
      typeof e === "string"
        ? (mqttKey = e)
        : e === null
        ? null
        : (mqttKey = JSON.stringify(e))
    )
    .catch((_e) => null);

  store
    .get("mqttSecret")
    .then((e: any) =>
      typeof e === "string"
        ? (mqttSecret = e)
        : e === null
        ? null
        : (mqttSecret = JSON.stringify(e))
    )
    .catch((_e) => null);

  store
    .get("deviceKey")
    .then((e: any) =>
      typeof e === "string"
        ? (deviceKey = e)
        : e === null
        ? null
        : (deviceKey = JSON.stringify(e))
    )
    .catch((_e) => null);

  return {
    port,
    dataBits,
    stopBits,
    parity,
    baudRate,
    mqttKey,
    mqttSecret,
    deviceKey,
  };
};

export default useGetStoredSettings;
