import React, { useState, useEffect } from "react";
import queryString from "query-string"; //this module retrieves data from the url
import io from "socket.io-client";
import dotenv from 'dotenv';

import "./Chat.css";

import InfoBar from "../InfoBar/InfoBar.component";
import Messages from "../Messages/Messages.component";
import Input from "../Input/Input.component";
import TextContainer from "../TextContainer/TextContainer.component";

dotenv.config();

let socket;

const Chat = ({ location }) => {
  const ENDPOINT = process.env.REACT_APP_ENDPOINT;
  // const ENDPOINT = "localhost:5000";

  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  // this effect hook handles new user joining
  useEffect(() => {
    const { name, room } = queryString.parse(location.search);

    socket = io(ENDPOINT);

    setName(name);
    setRoom(room);

    socket.emit("join", { name, room }, () => {});

    return () => {
      socket.emit("disconnect");
      socket.off();
    };
  }, [ENDPOINT, location.search]);

  // this effect hook handles receiving admin messages
  useEffect(() => {
    socket.on("message", (messagePayload) => {
      setMessages((messages) => [...messages, messagePayload]);
    });
  }, []);

  // this effect hook handles users array
  useEffect(() => {
    socket.on("roomData", (roomDataPayload) => {
      setUsers(roomDataPayload.users);
    });
  }, [users]);

  // event handler for sending user-generated messages
  const sendMessage = (event) => {
    event.preventDefault();
    if (message) {
      socket.emit("sendMessage", message, () => {
        setMessage("");
      });
    }
  };

  return (
    <div className="outerContainer">
      <div className="container">
        <InfoBar room={room} />
        <Messages 
        messages={messages} 
        name={name}
        />
        <Input
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
        />
      </div>
      <TextContainer users={users} />
    </div>
  );
};

export default Chat;
