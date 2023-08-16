import express from "express"
import ViteExpress from "vite-express"

const app = express()

// ##############################################################
// DELETE LATER: hard coding some WorkerPool data to see UI
const ds1 = "0"
const ds2 = "1"
const ds3 = "2"

const randomWP = {
  inbox: [{ [ds1]: 1, [ds2]: 3 }, { [ds1]: 2 }, { [ds1]: 3, [ds3]: 1 }, { [ds1]: 4 }, { [ds1]: 5 }],
  outbox: [{ [ds1]: 2 }, { [ds1]: 2, [ds3]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }],
  processing: [{ [ds1]: 1 }, { [ds1]: 0 }, { [ds1]: 1 }, { [ds1]: 1 }, { [ds1]: 1 }],
  label: "A",
}
const randomWP2 = {
  inbox: [
    { [ds1]: 5 },
    { [ds1]: 2 },
    { [ds1]: 3 },
    { [ds1]: 4 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 2 },
    { [ds1]: 3 },
    { [ds1]: 4 },
  ],
  outbox: [{ [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }],
  processing: [
    { [ds1]: 0 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 0 },
    { [ds1]: 1 },
    { [ds1]: 0 },
  ],
  label: "B",
}
// ##############################################################

app.get("/datasets", (_, res) => {
  res.json([
    { label: ds1, inbox: ~~(Math.random() * 20), outbox: 0 },
    { label: ds2, inbox: ~~(Math.random() * 20), outbox: 0 },
    { label: ds3, inbox: ~~(Math.random() * 20), outbox: 0 },
  ])
})

app.get("/workerpools", (_, res) => {
  res.json([randomWP, randomWP2])
})

ViteExpress.listen(app, 3000, () => console.log("Server is listening on port 3000..."))
