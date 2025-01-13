import * as LINEJS from "https://esm.sh/v135/@jsr/evex__linejs@2.0.0-rc1/es2022/evex__linejs.mjs";

// Desktop/vsc/line/web/indexedDB.ts
function successToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = (event) => {
            reject(event);
        };
    });
}
function completeToPromise(transaction) {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = (event) => {
            reject(event);
        };
    });
}
var IndexedDBStorage = class {
    onclose;
    onblocked;
    dbName;
    storeName;
    #db;
    constructor(dbName = "IndexedDBStorage", storeName = "linejs") {
        this.dbName = dbName;
        this.storeName = storeName;
    }
    addhandler(db) {
        db.onversionchange = () => {
            db.close();
            this.onclose && this.onclose();
        };
    }
    async open() {
        if (!this.#db) {
            const request = indexedDB.open(this.dbName);
            request.onblocked = () => {
                this.onblocked && this.onblocked();
            };
            request.onupgradeneeded = () => {
                const db = request.result;
                db.createObjectStore(this.storeName, { keyPath: "key" });
            };
            this.#db = await successToPromise(request);
            this.addhandler(this.#db);
        }
        return this.#db;
    }
    async set(key, value) {
        const db = await this.open();
        const transaction = db.transaction(this.storeName, "readwrite");
        const success = successToPromise(
            transaction.objectStore(this.storeName).put({ key, value })
        );
        const complete = completeToPromise(transaction);
        await success;
        await complete;
    }
    async get(key) {
        const db = await this.open();
        const transaction = db.transaction(this.storeName);
        const complete = completeToPromise(transaction);
        const value = await successToPromise(
            transaction.objectStore(this.storeName).get(key)
        );
        await complete;
        return value && value.value;
    }
    async delete(key) {
        const db = await this.open();
        const transaction = db.transaction(this.storeName, "readwrite");
        const success = successToPromise(
            transaction.objectStore(this.storeName).delete(key)
        );
        const complete = completeToPromise(transaction);
        await success;
        await complete;
    }
    async clear() {
        const db = await this.open();
        const version = db.version;
        db.close();
        const request = indexedDB.open(this.dbName, version + 1);
        request.onblocked = () => {
            this.onblocked && this.onblocked();
        };
        request.onupgradeneeded = () => {
            const db2 = request.result;
            db2.deleteObjectStore(this.storeName);
            db2.createObjectStore(this.storeName, { keyPath: "key" });
        };
        this.#db = await successToPromise(request);
        this.addhandler(this.#db);
    }
    async migrate(storage2) {
        const db = await this.open();
        const transaction = db.transaction(this.storeName, "readwrite");
        const complete = completeToPromise(transaction);
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.openCursor();
        const { promise, resolve } = Promise.withResolvers();
        const promises = [];
        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
                const { value, key } = cursor.value;
                promises.push(storage2.set(key, value));
                cursor.continue();
            } else {
                resolve();
            }
        };
        await Promise.all(promises);
        await promise;
        await complete;
    }
};

// Desktop/vsc/line/web/main.ts
var storage = new IndexedDBStorage();
document.querySelector("html").innerHTML = `
  <head>
      <!-- UI by @amex2189  -->
      <meta charset="UTF-8" />
      <meta http-equiv="Cache-Control" content="no-cache" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charset="UTF-8">
      <title>LINEJS on Browser</title>
      <link rel="stylesheet" href="https://cdn.ame-x.net/site-auto.css" />
  </head>
  
  <body>
      <style>
          body {
              width: 100%;
              margin: 15px;
              justify-content: center;
              align-items: center;
              flex-direction: column;
              flex-wrap: nowrap;
          }
      </style>
      <div class="box">
          <h2>LINEJS on Browser</h2>
          <div class="main">
              <button type="button" class="start">Start!!!</button>
          </div>
          <p>UI by <a href="https://x.com/amex2189">ame_x</a></p>
      </div>
  </body>`;
function dialog(message) {
    const d = create("dialog", { open: true });
    d.append(
        typeof message === "string" ? create("p", { innerText: message }) : message
    );
    const form = create("form", { method: "dialog" });
    form.appendChild(create("button", { innerText: "OK" }));
    d.appendChild(form);
    document.body.appendChild(d);
}
async function createField(name) {
    const val_feild = create("div", { className: "feild" });
    const val = create("input", {
        placeholder: name,
        name,
        type: "text",
        value: (await storage.get(":" + name) || "").toString()
    });
    val.oninput = () => {
        storage.set(":" + name, val.value);
    };
    val_feild.appendChild(
        create("label", { htmlFor: name, innerText: name })
    );
    val_feild.appendChild(val);
    return [val, val_feild];
}
async function init() {
    const main = query(".main");
    if (!main) {
        throw new Error("not found main");
    }
    main.innerHTML = "";
    const device_feild = create("div", { className: "device_feild" });
    const device = create("select", { name: "device" });
    ["IOSIPAD", "DESKTOPWIN", "DESKTOPMAC"].forEach(
        (innerText) => device.appendChild(create("option", { innerText, value: innerText }))
    );
    device.value = (await storage.get(":device") || "").toString();
    device.oninput = () => {
        storage.set(":device", device.value);
    };
    device_feild.appendChild(
        create("label", { htmlFor: "device", innerText: "device" })
    );
    device_feild.appendChild(device);
    main.appendChild(device_feild);
    const [email, email_feild] = await createField("email");
    main.appendChild(email_feild);
    const [password, password_feild] = await createField("password");
    password.type = "password";
    main.appendChild(password_feild);
    const [authToken, authToken_feild] = await createField("authToken");
    main.appendChild(authToken_feild);
    const option_feild = create("div", { className: "option_feild" });
    const option = create("select", { name: "option" });
    ["QRcode", "Email&Password", "AuthToken"].forEach(
        (innerText) => option.appendChild(create("option", { innerText, value: innerText }))
    );
    option.value = (await storage.get(":option") || "").toString();
    option.oninput = () => {
        storage.set(":option", option.value);
    };
    option_feild.appendChild(
        create("label", { htmlFor: "option", innerText: "\u30ED\u30B0\u30A4\u30F3\u65B9\u6CD5" })
    );
    option_feild.appendChild(option);
    main.appendChild(option_feild);
    const login = create("button", { innerText: "\u30ED\u30B0\u30A4\u30F3" });
    main.appendChild(login);
    login.addEventListener("click", async () => {
        const val_device = device.value;
        const val_email = email.value;
        const val_pw = password.value;
        const val_authToken = authToken.value;
        const val_option = option.value;
        if (!val_device) {
            return dialog("device\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044!");
        }
        if (!val_option) {
            return dialog("\u30ED\u30B0\u30A4\u30F3\u65B9\u6CD5\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044!");
        }
        const client = load(val_device);
        client.on("pincall", (P) => {
            dialog(`pincode\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044: ${P}`);
        });
        client.on("qrcall", (q2) => {
            const div = create("div");
            div.appendChild(create("p", { innerText: "QR\u30B3\u30FC\u30C9:" }));
            div.appendChild(create("img", {
                src: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(q2)}`
            }));
            dialog(div);
        });
        client.on("ready", (u) => {
            dialog(`\u30ED\u30B0\u30A4\u30F3\u3057\u307E\u3057\u305F: ${u.displayName} [${u.mid}]`);
        });
        if (val_option === "QRcode") {
            try {
                await client.login({ qr: true });
            } catch (error) {
                return dialog(
                    error.name + "\n" + error.message
                );
            }
        } else if (val_option === "Email&Password") {
            if (!val_email || !val_pw) {
                return dialog("email\u3068password\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044!");
            }
            try {
                await client.login({ email: val_email, password: val_pw });
            } catch (error) {
                return dialog(
                    error.name + "\n" + error.message
                );
            }
        } else if (val_option === "AuthToken") {
            if (!val_authToken) {
                return dialog("authToken\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044!");
            }
            try {
                await client.login({ authToken: val_authToken });
            } catch (error) {
                return dialog(
                    error.name + "\n" + error.message
                );
            }
        }
        main.innerHTML = "";
        main.appendChild(create("pre", { innerText: JSON.stringify(client.profile, null, 2) }));
    });
}
function load(device) {
    const client = new LINEJS.Client({
        device,
        storage,
        endpoint: location.hostname
    });
    client.fetch = window.fetch.bind(window);
    client.on("log", (p) => console.log(p));
    client.on("update:authtoken", (authToken) => {
        client.storage.set(":authToken", authToken);
    });
    return client;
}
function query(search) {
    return document.querySelector(search);
}
function create(name, property = {}, attr = {}) {
    const dom = document.createElement(name);
    for (const key in property) {
        if (typeof property[key] !== "undefined" && typeof dom[key] !== "undefined") {
            dom[key] = property[key];
        }
    }
    for (const key in attr) {
        if (typeof attr[key] == "string") {
            dom.setAttribute(key, attr[key]);
        }
    }
    return dom;
}
var I = setInterval(() => {
    const e = query(".start");
    if (e) {
        e.addEventListener("click", () => {
            init();
        });
        clearInterval(I);
    }
}, 100);
