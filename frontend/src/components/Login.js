import PubSub from "pubsub-js";
import { SHOW_LOGIN, SHOW_MAIN_VIEW, SHOW_SIGNUP } from "../utils/topics.js";
import { axiosInstance } from "../utils/axios.js";
import { toast } from "./toast.js";
import appStore from "../utils/appStore.js";

export default class Login {
    constructor(parent = document.body) {
        this.render(parent)
        const authFromFirstRender = null;
    }
    
    render(parent) {
        
        PubSub.subscribe(SHOW_LOGIN, (topic, _) => {
            console.log(topic)

            if (this.authFromFirstRender) {
                parent.appendChild(this.authFromFirstRender)
                return;
            }

            const div = document.createElement("div");
            div.classList.add("auth");
            div.innerHTML = `
            <form>
                <div class="text-box">
                    <h2>Sign in</h2>
                    <p>Don't have an account? <a href="#">Sign up</a></p>
                </div>

                <div class="role-div">
                    <label for="student">Student</label>
                    <input type="radio" value="Student" name="role" id="student" checked>
                </div>

                <div class="role-div">
                    <label for="lecturer">Lecturer</label>
                    <input type="radio" value="Lecturer" name="role" id="lecturer">
                </div>

                <div class="field-section">
                    <div class="lecturer-field">
                        <div class="form-group">
                            <label for="staff-id">StaffID</label>
                            <input id="staff-id" name="staffId" type="text" placeholder="" required disabled>
                        </div>
                    </div>

                    <div class="student-field">
                        <div class="form-group">
                            <label for="reg-no">RegNo</label>
                            <input id="reg-no" name="regNo" type="text" placeholder="AKP/ASC/SWD/HND2023/001" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input id="password" name="password" type="password" placeholder="••••••••••" required>
                    </div>
                </div>
                <button>submit</button>
                <p class="home-link"> Go back to <a href="/"> home page</a></p>
            </form>
            `
            this.addEventListeners(div);

            this.authFromFirstRender = div;
            parent.appendChild(this.authFromFirstRender);
        })
    }

    addEventListeners(loginAuth) {
        const signupLink = loginAuth.querySelector(".text-box a");
        const loginForm = loginAuth.querySelector("form");
        const lecturerFields = loginAuth.querySelectorAll(".lecturer-field input");
        const studentFields = loginAuth.querySelectorAll(".student-field input");

        signupLink.addEventListener("click", (e) => {
            e.preventDefault();

            loginForm.reset();

            loginAuth.remove();

            PubSub.publish(SHOW_SIGNUP);
        })

        loginForm.addEventListener("change", e => {
            const clickedElem = e.target;
            if (!clickedElem.closest(".role-div")) return;

            if (clickedElem.value === "Student") {
                lecturerFields.forEach(field => {
                    field.disabled = true;

                    studentFields.forEach(field => {
                        field.disabled = false;
                    })
                })
            } else {
                studentFields.forEach(field => {
                    field.disabled = true;

                    lecturerFields.forEach(field => {
                        field.disabled = false;
                    })
                })
            }

        })

        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(e.target))

            try {
                const res = await axiosInstance.post(`/auth/login${formData.role}`, formData);
                appStore.setAuthUser(res.data)

                loginForm.reset();

                loginAuth.remove();
                
                console.log(appStore.getAuthUser())
                location.reload();
            } catch (err) {
                console.error("Error in request to log user in:", err?.response?.data?.message);
                toast.error(err?.response?.data?.message);
            }
        })
    }
}