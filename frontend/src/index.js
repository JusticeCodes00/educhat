import "./style.css";
import { axiosInstance } from "./utils/axios.js";
import { toast } from "./components/toast.js";
import PubSub from "pubsub-js";
import { createIcons, icons } from 'lucide';
import MainView from "./components/MainView.js";
import Login from "./components/Login.js";
import Signup from "./components/Signup.js";
import io from "socket.io-client";
import HomePage from "./components/HomePage.js";

new Login();
new Signup();
new HomePage()
new MainView();