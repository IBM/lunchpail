import express from "express"
import ViteExpress from "vite-express"

const app = express()

// ##############################################################
// DELETE LATER: hard coding some WorkerPool data to see UI
const randomWP = {
  sizeInbox: [1, 2, 3, 4, 5],
  sizeOutbox: Array(5).fill(2),
  sizeProcessing: [1, 0, 1, 1, 1],
  label: "A",
}
const randomWP2 = {
  sizeInbox: [5, 2, 3, 4, 1, 1, 2, 3, 4],
  sizeOutbox: Array(5).fill(2),
  sizeProcessing: [0, 1, 1, 1, 1, 1, 0, 1, 0],
  label: "B",
}
// ##############################################################

app.get("/datasets", (_, res) => {
  res.json([{ label: "1", inbox: ~~(Math.random() * 20), outbox: ~~(Math.random() * 10) }])
})

app.get("/workerpools", (_, res) => {
  res.json([randomWP, randomWP2])
})

ViteExpress.listen(app, 3000, () => console.log("Server is listening on port 3000..."))
