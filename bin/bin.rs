use tauri::http::ResponseBuilder;
use std::path::Path;
use std::fs;

.register_uri_scheme_protocol("werkorderrequest", move |_app, request| {
  // generate error response
  let res_not_img = ResponseBuilder::new()
    .status(404)
    .header("Access-Control-Allow-Origin", "*")
    .body(Vec::new());

  // if not GET method -> return error resp
  if request.method() != "GET" {
    return res_not_img;
  }

  //get URI
  let uri = request.uri();

  //find start of file name ?n=FILENAME
  let start_pos = match uri.find("?n=") {
    Some(_pos) => _pos + 3,
    None => return res_not_img,
  };

  // get file name from start pos
  let filename = &uri[start_pos..];

  //check if file exists
  let path = format!("X:/SCANS/JPSoftware/ProduktieOrder/{}.pdf", filename);
  if !Path::new(&path).exists() {
    return res_not_img;
  }
  let local_img = if let Ok(data) = fs::read(path) {
    tauri::http::ResponseBuilder::new()
      .mimetype("application/pdf")
      .header("Access-Control-Allow-Origin", "*")
      .body(data)
  } else {
    res_not_img
  };
  local_img
})










/* fn read_port(mut port: std::boxed::Box<dyn serialport::SerialPort>) -> Result<String, String> {
let mut serial_buf: Vec<u8> = vec![0; 1000];

let mut buf_size: usize = 0;
let mut line_buf: Vec<u8> = vec![0; 1000];

loop {
  match port.read(serial_buf.as_mut_slice()) {
    Ok(t) => {
      let mut break_out_of_loop = false;

      for elem in &serial_buf[..t] {
        line_buf.insert(buf_size, *elem);
        buf_size += 1;
        if *elem == 10 {
          break_out_of_loop = true;
          break;
        }

        if buf_size > 50 {
          break_out_of_loop = true;
          break;
        }
      }

      if break_out_of_loop {
        break;
      } else {
        continue;
      }
    }
    Err(ref e) if e.kind() == io::ErrorKind::TimedOut => (),
    Err(_e) => {
      return Err("Device connection was lost.".to_string());
    }
  }
} */

/* let port = loop {
  let port = serialport::new(port_name.clone(), baud_rate)
    .data_bits(data_bits)
    .stop_bits(stop_bits)
    .parity(parity)
    .timeout(Duration::from_millis(1000))
    .open();

  match port {
    Ok(port) => break port,
    Err(_e) => {
      app_handle
        .emit_all("rs232-error", format!("Failed to open {}", port_name))
        .unwrap();
      std::thread::sleep(Duration::from_millis(5));
      continue;
    }
  }
};

match read_port(port) {
  Ok(s) => {
    app_handle.emit_all("rs232", s).unwrap();
  }
  Err(e) => {
    app_handle.emit_all("rs232-error", e).unwrap();
    continue;
  }
} */

//println!("{:?}", &line_buf[..buf_size]);

/*   println!("SIZE OF LINE BUF = {:?}", line_buf.len());

  let s = match str::from_utf8(&line_buf[..buf_size]) {
    Ok(v) => v,
    Err(_e) => {
      return Err("Failed to read message.".to_string());
    }
  };

  return Ok(s.to_string());
} */

/* fn read_port(port: std::boxed::Box<dyn serialport::SerialPort>) -> Result<String, String> {
  let mut reader = BufReader::new(port);
  let mut my_str = String::new();
  loop {
    match reader.read_line(&mut my_str) {
      Ok(_t) => {
        return Ok(my_str);
      }
      Err(ref e) if e.kind() == io::ErrorKind::TimedOut => (),
      Err(_e) => {
        return Err("Device connection was lost.".to_string());
      }
    }
  }
} */

/*


struct TXRXState {
  tx: tokio::sync::mpsc::Sender<std::string::String>,
  rx: tokio::sync::mpsc::Receiver<std::string::String>,
}

fn main() {
  let (tx, rx): (Sender<String>, Receiver<String>) = mpsc::channel(32);

  tauri::Builder::default()
    .manage(TXRXState { tx, rx })

/* // Do something... (basically what you already doing right now, the "basic rust" stuff)
        let mqtt_key = "WOJ=s5(}UL&,rxE{G@Citls~%TV5y7Ht|%}ZN6FV";
        let mqtt_secret =
          "q,8?vDujDJe<wOYtH@)hE!9;c-%[iW<Xb^+?HBjJg>,St1>2,9/y|f1O9|*G-J]m_B$2$b?@*HiUl7-v";
        let device_key = "c975f23e-daee-449a-b600-61afe52aadb5";

        // Create a client.
        let mut mqttoptions = MqttOptions::new(device_key, "mqtt.exalise.com", 1883);
        let will = LastWill::new(
          format!("exalise/lastwill/{}", device_key),
          "disconnected",
          QoS::AtLeastOnce,
          false,
        );

        mqttoptions.set_last_will(will);
        mqttoptions.set_credentials(mqtt_key, mqtt_secret);
        mqttoptions.set_keep_alive(Duration::from_secs(5));
        let (mut client, mut connection) = Client::new(mqttoptions, 10);

        client
          .publish(
            format!("exalise/lastwill/{}", device_key),
            QoS::AtLeastOnce,
            false,
            "connected".as_bytes().to_vec(),
          )
          .unwrap();

        /*
         client
        .publish(
          format!("exalise/messages/{}/Test", device_key),
          QoS::AtLeastOnce,
          false,
          &serial_buf[..t],
        )
        .unwrap();

        */

        std::thread::spawn(move || loop {
          let port = loop {
            let port = serialport::new(port_name, baud_rate)
              .data_bits(DataBits::Seven)
              .stop_bits(StopBits::One)
              .parity(Parity::Even)
              .timeout(Duration::from_millis(10))
              .open();

            match port {
              Ok(port) => break port,
              Err(_e) => {
                handle
                  .emit_all("rs232-error", format!("Failed to open {}", port_name))
                  .unwrap();
                std::thread::sleep(Duration::from_millis(1000));
                continue;
              }
            }
          };

          match read_port(port) {
            Ok(s) => {
              /* client
              .publish(
                format!("exalise/messages/{}/Test", device_key),
                QoS::AtLeastOnce,
                false,
                s.clone(),
              )
              .unwrap(); */
              handle.emit_all("rs232", s).unwrap();
            }
            Err(e) => {
              handle.emit_all("rs232-error", e).unwrap();
              continue;
            }
          }
        });

        for (_i, notification) in connection.iter().enumerate() {
          println!("Notification = {:?}", notification);
        } */

.setup(|app| {
      let handle = app.handle();
      let port_name = "COM3";
      let baud_rate = 9600;

      std::thread::spawn(move || {
        // Do something... (basically what you already doing right now, the "basic rust" stuff)
        let mqtt_key = "WOJ=s5(}UL&,rxE{G@Citls~%TV5y7Ht|%}ZN6FV";
        let mqtt_secret =
          "q,8?vDujDJe<wOYtH@)hE!9;c-%[iW<Xb^+?HBjJg>,St1>2,9/y|f1O9|*G-J]m_B$2$b?@*HiUl7-v";
        let device_key = "c975f23e-daee-449a-b600-61afe52aadb5";

        // Create a client.
        let mut mqttoptions = MqttOptions::new(device_key, "mqtt.exalise.com", 1883);
        let will = LastWill::new(
          format!("exalise/lastwill/{}", device_key),
          "disconnected",
          QoS::AtLeastOnce,
          false,
        );

        mqttoptions.set_last_will(will);
        mqttoptions.set_credentials(mqtt_key, mqtt_secret);
        mqttoptions.set_keep_alive(Duration::from_secs(5));
        let (mut client, mut connection) = Client::new(mqttoptions, 10);

        client
          .publish(
            format!("exalise/lastwill/{}", device_key),
            QoS::AtLeastOnce,
            false,
            "connected".as_bytes().to_vec(),
          )
          .unwrap();

        /*
         client
        .publish(
          format!("exalise/messages/{}/Test", device_key),
          QoS::AtLeastOnce,
          false,
          &serial_buf[..t],
        )
        .unwrap();

        */

        std::thread::spawn(move || loop {
          let port = loop {
            let port = serialport::new(port_name, baud_rate)
              .data_bits(DataBits::Seven)
              .stop_bits(StopBits::One)
              .parity(Parity::Even)
              .timeout(Duration::from_millis(10))
              .open();

            match port {
              Ok(port) => break port,
              Err(_e) => {
                handle
                  .emit_all("rs232-error", format!("Failed to open {}", port_name))
                  .unwrap();
                std::thread::sleep(Duration::from_millis(1000));
                continue;
              }
            }
          };

          match read_port(port) {
            Ok(s) => {
              /* client
              .publish(
                format!("exalise/messages/{}/Test", device_key),
                QoS::AtLeastOnce,
                false,
                s.clone(),
              )
              .unwrap(); */
              handle.emit_all("rs232", s).unwrap();
            }
            Err(e) => {
              handle.emit_all("rs232-error", e).unwrap();
              continue;
            }
          }
        });

        for (_i, notification) in connection.iter().enumerate() {
          println!("Notification = {:?}", notification);
        }
      });
      Ok(())
    })

    */
