import * as fs from "fs"

function generateIndex(path_directory: string) {
  fs.stat(path_directory, (err, stat) => {
    if (!err) {
      if (stat.isDirectory()) {
        if (fs.existsSync(`${path_directory}/index.ts`))
          fs.unlink(`${path_directory}/index.ts`, function (err) {
            if (err) return console.log(err)
          })
        fs.readdirSync(path_directory).forEach((file) => {
          const [name, _] = file.split(".")
          if (name !== "index") {
            fs.writeFile(`${path_directory}/index.ts`, `export * as ${name} from "./${name}"\n`, { flag: "a+" }, (err) => {
              if (err) console.error(err)
            })
          }
        })
      }
    }
  })
}

generateIndex("./src")
