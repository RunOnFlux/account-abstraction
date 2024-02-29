import * as fs from "fs"

function generateExportedAbiIndex(path_directory: string) {
  fs.stat(path_directory, (error, stat) => {
    if (!error && stat.isDirectory()) {
      if (fs.existsSync(`${path_directory}/index.ts`))
        fs.unlink(`${path_directory}/index.ts`, function (error_) {
          if (error_) return console.log(error_)
        })
      fs.readdirSync(path_directory).forEach((file) => {
        const [name, _] = file.split(".")
        if (name !== "index")
          fs.writeFile(`${path_directory}/index.ts`, `export { default as ${name}_abi } from "./${file}"\n`, { flag: "a+" }, (error_) => {
            if (error_) console.error(error_)
          })
      })
    }
  })
}

generateExportedAbiIndex("./src/abi")
