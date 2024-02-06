import hre from "hardhat"
import * as fs from "fs"

async function exportDeploymentsAddresses(path_directory: string) {
  const chainId = await hre.getChainId()

  const deployments = await hre.deployments.all()

  const deploymentsAddresses = Object.keys(deployments).reduce(
    (acc, deployment) => {
      acc[deployment] = deployments[deployment].address

      return acc
    },
    {} as { [key: string]: string }
  )

  if (!fs.existsSync(path_directory)) {
    fs.mkdirSync(path_directory)
  }

  fs.stat(path_directory, (err, stat) => {
    if (!err) {
      if (stat.isDirectory()) {
        let deployments: { [key: string]: any } = {}
        if (fs.existsSync(`${path_directory}/deployments.json`))
          deployments = JSON.parse(fs.readFileSync(`${path_directory}/deployments.json`, "utf8"))
        fs.unlink(`${path_directory}/deployments.json`, function (err) {
          if (err) return console.log(err)
        })
        deployments[chainId] = {
          ...deployments[chainId],
          ...deploymentsAddresses,
        }
        fs.writeFile(`${path_directory}/deployments.json`, JSON.stringify(deployments, null, 2), { flag: "a+" }, (err) => {
          if (err) console.error(err)
        })
      }
    }
  })
}

exportDeploymentsAddresses("./src/deployments")
