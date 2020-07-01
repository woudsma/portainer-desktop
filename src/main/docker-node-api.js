import { Docker } from "node-docker-api";
import { exec } from "child_process";
import fs from "fs";

const dataFolder = "/tmp";
const socket = "/var/run/docker.sock";
const isSocket = fs.existsSync(socket) ? fs.statSync(socket).isSocket() : false;
const docker = isSocket ? new Docker() : new Docker({ socketPath: socket });

export const promisifyStream = (stream) =>
  new Promise((resolve, reject) => {
    stream.on("data", (data) => console.log(data.toString()));
    stream.on("end", resolve);
    stream.on("error", reject);
  });

export const isDockerRunning = () => docker.ping();

export const isDockerContainerRunning = async (name) => {
  if (!(await isDockerRunning())) return;

  return docker.container
    .list()
    .then((containers) => {
      console.log(containers);
      if (containers.length) return containers[0].status();
      else throw new Error("No containers");
    })
    .then((container) => {
      console.log(container);
      return container.stats();
    })
    .then((stats) => {
      stats.on("data", (stat) => console.log("Stats: ", stat.toString()));
      stats.on("error", (err) => console.log("Error: ", err));
    });
};

export const startDocker = async () => {
  console.log("starting docker");

  await new Promise((resolve, reject) => {
    exec("open --background -a Docker", (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr) return console.log(`stderr: ${stderr}`);
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });

  // docker
  //   .events({
  //     since: (new Date().getTime() / 1000 - 60).toFixed(0),
  //   })
  //   .then((stream) => promisifyStream(stream))
  //   .catch((error) => console.log(error));
};

export const startDockerContainer = async ({ image, name }) => {
  await docker.image.create({}, { fromImage: image });
  return (
    docker.container
      .create({
        name: `${name}-${Math.random().toFixed(6)}`,
        Image: image,
        HostConfig: {
          PortBindings: {
            "9000/tcp": [
              // port on host machine
              { HostPort: "9000" },
            ],
          },
          Volumes: {
            [socket]: {},
            [dataFolder]: {},
          },
          Binds: [`${socket}:${socket}`, `${dataFolder}:/data`],
        },
        ExposedPorts: {
          // port inside of docker container
          "9000/tcp": {},
          "8000/tcp": {},
        },
      })
      .then((container) => container.start())
      // .then((container) => (container.stop()))
      // .then((container) => container.restart())
      // .then((container) => container.delete({ force: true }))
      .catch((error) => console.log(error))
  );
};

export const initDocker = async (options) => {
  try {
    await isDockerRunning();
    console.log("Docker is already running");
  } catch (err) {
    console.error("Docker is not running.\nError message:", err);
    console.error("Starting Docker");
    await startDocker();
  }
  try {
    await isDockerContainerRunning("Portainer");
    console.log("Docker container is already running");
  } catch (err) {
    console.log("Docker container is not running.\nError message:", err);
    console.error("Starting Docker container");
    await startDockerContainer(options);
  }
};
