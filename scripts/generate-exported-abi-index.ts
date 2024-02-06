import * as fs from "fs"
import * as path from "path"

function generateExportedAbiIndex(path_directory: string) {
  fs.stat(path_directory, (err, stat) => {
    if (!err) {
      if (stat.isDirectory()) {
        if (fs.existsSync(`${path_directory}/index.ts`))
          fs.unlink(`${path_directory}/index.ts`, function (err) {
            if (err) return console.log(err)
          })
        fs.readdirSync(path_directory).forEach((file) => {
          const [name, _] = file.split(".")
          if (name !== "index")
            fs.writeFile(`${path_directory}/index.ts`, `export { default as ${name}_abi } from "./${file}"\n`, { flag: "a+" }, (err) => {
              if (err) console.error(err)
            })
        })
      }
    }
  })
}

generateExportedAbiIndex("./src/abi")
