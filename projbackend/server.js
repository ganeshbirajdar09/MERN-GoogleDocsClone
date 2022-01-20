require("dotenv").config();
const mongoose = require("mongoose");
const Document = require("./models/Document");

// DB CONNECTION
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// we need cors , our client and server both are on diff urls
// cors helps in making reqs
const io = require("socket.io")(8080, {
  cors: {
    origin: "http://localhost:3000", // where our client is
    methods: ["GET", "POST"], // methods allowed
  },
});

const defaultValue = "";

// everytime client connects
io.on("connection", (socket) => {
  // grabbing the docId from client
  socket.on("get-document", (documentId) => {
    const document = findOrCreateDocument(documentId);

    // putting user in one room
    socket.join(documentId); // putting this socket in a specific room
    socket.emit("load-document", document.data);

    // getting changes from client
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    //saving the doc
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

// whenever we get a docId
const findOrCreateDocument = async (id) => {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;

  //by default if we dont have a doc we are going just make one
  return await Document.create({ _id: id, data: defaultValue });
};
