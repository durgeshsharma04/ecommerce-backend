import app from "./app";

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`Product service running on ${PORT}`);
});