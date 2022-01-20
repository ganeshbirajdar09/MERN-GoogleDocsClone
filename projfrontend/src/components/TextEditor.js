import React, { useCallback, useEffect, useState } from "react";
import Quill from "quill";

// stylesheet for quill (snow theme)
import "quill/dist/quill.snow.css";

//client version of socket io
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
require("dotenv").config();

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

const TextEditor = () => {
  const { id: documentId } = useParams(); //renaming as documentId
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  console.log(documentId);

  //
  useEffect(() => {
    const s = io("http://localhost:8080");
    setSocket(s);

    return () => {
      //calling disconnect function
      s.disconnect();
    };
  }, []);

  // making sure the changes occur on that specific doc-id
  useEffect(() => {
    if (socket == null || quill == null) return;

    // once cleans up after running once
    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });

    // send doc-id to the server
    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  // saving the doc
  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, process.env.SAVE_INTERVAL_MS);
    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  // on receiving changes
  useEffect(() => {
    if (socket == null || quill == null) return;

    // running the changes (updating the doc)
    const handler = (delta, oldDelta, source) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);
    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  // detecting text-change on quill changes
  useEffect(() => {
    // making sure we have socket and quill
    if (socket == null || quill == null) return;

    // read the docs
    const handler = (delta, oldDelta, source) => {
      // changes should be done by the user
      if (source !== "user") return;
      // emit msg from client to server - delta is that small subset of whats changed in the doc and not the whole doc
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);
    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = ""; // to avoid multiple toolbars

    const editor = document.createElement("div");
    wrapper.append(editor);

    //new instance of the quill editor (inside useCall coz we want it to render only once)
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);

  return (
    <div className="container" ref={wrapperRef}>
      <p>Google Docs clone</p>
    </div>
  );
};

export default TextEditor;
