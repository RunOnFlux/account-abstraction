import * as fs from "fs"

import hre from "hardhat"

async function exportDeploymentsAddresses(path_directory: string) {
  const chainId = await hre.getChainId()

  const deploys = await hre.deployments.all()

  const deploymentsAddresses = Object.keys(deploys).reduce(
    (accumulator, deployment) => {
      accumulator[deployment] = deploys[deployment].address

      return accumulator
    },
    {} as Record<string, string>
  )

  if (!fs.existsSync(path_directory)) fs.mkdirSync(path_directory)

  fs.stat(path_directory, (error, stat) => {
    if (!error && stat.isDirectory()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let deployments: Record<string, any> = {}
      if (fs.existsSync(`${path_directory}/deployments.json`))
        deployments = JSON.parse(fs.readFileSync(`${path_directory}/deployments.json`, "utf8"))
      fs.unlink(`${path_directory}/deployments.json`, function (error_) {
        if (error_) return console.log(error_)
      })
      deployments[chainId] = {
        ...deployments[chainId],
        ...deploymentsAddresses,
      }
      fs.writeFile(`${path_directory}/deployments.json`, JSON.stringify(deployments, null, 2), { flag: "a+" }, (error_) => {
        if (error_) console.error(error_)
      })
    }
  })
}

exportDeploymentsAddresses("./src/deployments")
