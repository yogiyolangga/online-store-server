const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "dbphsarleaudb",
});

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Menangani routing statis untuk direktori 'uploads'
app.use(
  "/uploads/products",
  express.static(path.join(__dirname, "uploads/products"))
);

app.use(
  "/uploads/icons",
  express.static(path.join(__dirname, "uploads/icons"))
);

app.use(
  session({
    key: "userId",
    secret: "psharleau",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

app.get("/", (req, res) => {
  res.send("RESTAPI!");
});

// Register Client
app.post("/api/client/register", async (req, res) => {
  const fullname = req.body.fullname;
  const username = req.body.username;
  const phoneNumber = req.body.phoneNumber;
  const email = req.body.email;
  const password = req.body.password;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (fullname.trim() === "") {
    res.status(400).json({ errorValidation: "Please input your Full Name." });
    return;
  } else if (username.trim() === "") {
    res.status(400).json({ errorValidation: "Please input Username" });
    return;
  } else if (phoneNumber.trim() === "") {
    res.status(400).json({ errorValidation: "Please input your Phone Number" });
    return;
  } else if (!emailRegex.test(email)) {
    res.status(400).json({ errorValidation: "Please input valid email" });
    return;
  }

  const generateHash = async (password) => {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  };

  // Generate hash password
  let hashPass = "";
  try {
    hashPass = await generateHash(password);
  } catch (err) {
    console.error("Error generating hash:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  const sqlInsert =
    "INSERT INTO user (fullname, username, number, email, password) VALUES (?,?,?,?,?)";

  db.query(
    sqlInsert,
    [fullname, username, phoneNumber, email, hashPass],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.status(200).json({
          success: "Registration successfully, please login!",
          result,
        });
      }
    }
  );
});

// Login Client API
app.post("/api/client/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  db.query(
    "SELECT * FROM user WHERE username = ?",
    [username],
    async (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      if (result.length === 0) {
        res.send({ error: "Invalid username or password" });
        return;
      }

      const hashedPassword = result[0].password;

      try {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) {
          res.send({ error: "Invalid username or password" });
          return;
        }

        const token = jwt.sign({ userId: result[0].id }, "secret_key", {
          expiresIn: "1h",
        });

        res
          .status(200)
          .json({ success: "Login successfully", token, username });
      } catch (err) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );
});

// Get Data Client
app.get("/api/client/data/:username", (req, res) => {
  const username = req.params.username;
  const sqlSelect = "SELECT * FROM user WHERE username = ?";

  db.query(sqlSelect, [username], (err, result) => {
    if (err) {
      res.send({ err: err });
      console.log(err);
    }

    if (result.length > 0) {
      res.send(result);
    } else {
      res.send({ message: "No Data User!" });
    }
  });
});

// Update Name Client
app.put("/api/client/upname/:username", (req, res) => {
  const username = req.params.username;
  const newName = req.body.userFullName;

  const sqlUpdate = "UPDATE user SET fullname = ? WHERE username = ?";

  if (newName === "") {
    res.send({ error: "Please input real name!" });
  } else {
    db.query(sqlUpdate, [newName, username], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send({ success: "Your name has change!" });
      }
    });
  }
});

// Update Number Client
app.put("/api/client/upnumber/:username", (req, res) => {
  const username = req.params.username;
  const userNumber = req.body.userNumber;

  const sqlUpdate = "UPDATE user SET number = ? WHERE username = ?";

  if (userNumber === "") {
    res.send({ error: "Please input number!" });
  } else {
    db.query(sqlUpdate, [userNumber, username], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send({ success: "Your number has change!" });
      }
    });
  }
});

// Update Email Client
app.put("/api/client/upemail/:username", (req, res) => {
  const username = req.params.username;
  const userEmail = req.body.userEmail;

  const sqlUpdate = "UPDATE user SET email = ? WHERE username = ?";

  if (userEmail === "") {
    res.send({ error: "Please input email!" });
  } else {
    db.query(sqlUpdate, [userEmail, username], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send({ success: "Your email has change!" });
      }
    });
  }
});

// Update Gender Client
app.put("/api/client/upgender/:username", (req, res) => {
  const username = req.params.username;
  const userGender = req.body.userGender;

  const sqlUpdate = "UPDATE user SET gender = ? WHERE username = ?";

  if (userGender === "") {
    res.send({ error: "Please input Gender!" });
  } else {
    db.query(sqlUpdate, [userGender, username], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send({ success: "Your Gender has update!" });
      }
    });
  }
});

// Update Birthday Client
app.put("/api/client/upbirthday/:username", (req, res) => {
  const username = req.params.username;
  const userBirthday = req.body.userBirthday;

  const sqlUpdate = "UPDATE user SET birthday = ? WHERE username = ?";

  if (userBirthday === "") {
    res.send({ error: "Please input Birthday!" });
  } else {
    db.query(sqlUpdate, [userBirthday, username], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send({ success: "Your Birthday has update!" });
      }
    });
  }
});

//Update Address Client
app.get("/api/client/address/:username", (req, res) => {
  const username = req.params.username;
  const sqlSelect = "SELECT address FROM user WHERE username = ?";

  if (username === undefined || username === "") {
    res.send({ error: "Error username not found" });
  } else {
    db.query(sqlSelect, username, (err, result) => {
      if (err) {
        res.send({ error: err });
      } else {
        res.send({ success: "Success get address", result });
      }
    });
  }
});

app.put("/api/client/address/:username", (req, res) => {
  const username = req.params.username;
  const address = req.body.address;
  const sqlUpdate = "UPDATE user SET address = ? WHERE username = ?";

  if (address === "") {
    res.send({ error: "Address cannot be empty!" });
  } else if (address.length < 15) {
    res.send({ error: "Please give more detail address!" });
  } else {
    db.query(sqlUpdate, [address, username], (err, result) => {
      if (err) {
        res.send({ error: err });
      } else {
        res.send({ success: "Success update address!" });
      }
    });
  }
});

// Client Create Store
app.post("/api/client/createstore", (req, res) => {
  const username = req.body.username;
  const storeName = req.body.storeName;
  const description = req.body.description;
  const category = req.body.category;

  const sqlInsert =
    "INSERT INTO store (id_user, name, description, category) VALUES (?,?,?,?)";

  if (storeName === "") {
    res.send({ error: "Please input your Store name!" });
  } else if (description === "") {
    res.send({ error: "Please add description store!" });
  } else if (category === "") {
    res.send({ error: "Please select category store!" });
  } else {
    db.query(
      sqlInsert,
      [username, storeName, description, category],
      (err, result) => {
        if (err) {
          res.send({ error: err });
        } else {
          res.send({ success: "Your Store Create Successfully!" });
        }
      }
    );
  }
});

// Client Check Store
app.get("/api/client/checkstore/:username", (req, res) => {
  const username = req.params.username;

  const sqlSelect = "SELECT * FROM store WHERE id_user = ?";

  db.query(sqlSelect, username, (err, result) => {
    if (result.length > 0) {
      res.send({ set: "true" });
    } else if (result.length == 0) {
      res.send({ notset: "false" });
    } else {
      console.log(err);
    }
  });
});

// Client Get Data Store
app.get("/api/client/getstore/:username", (req, res) => {
  const username = req.params.username;
  const sqlSelect = "SELECT * FROM store WHERE id_user = ?";

  db.query(sqlSelect, username, (err, result) => {
    if (err) {
      res.send({ error: "Error get store data!" });
    } else {
      res.send(result);
    }
  });
});

// Client Get Categories
app.get("/api/client/getcategory", (req, res) => {
  const sqlSelect = "SELECT * FROM category";
  db.query(sqlSelect, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send(result);
    }
  });
});

// Client Add Product
// Konfigurasi multer untuk menyimpan file di folder 'uploads'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/products");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post("/api/client/addproduct", upload.single("image"), (req, res) => {
  const idUser = req.body.userLogin;
  const name = req.body.name;
  const imagePath = req.file.path;
  const idCategory = req.body.category;
  const description = req.body.description;
  const price = req.body.price;
  const stock = req.body.stock;
  const discount = req.body.discount;
  const status = "available";
  const rating = 0;

  const sqlSelect = "SELECT * FROM product";

  const sqlInsert =
    "INSERT INTO product (id_product, id_user, id_category, name, description, price, stock, img, status, rating, discount) VALUES (?,?,?,?,?,?,?,?,?,?,?)";

  let idProduct = "";

  db.query(sqlSelect, (err, result) => {
    if (err) {
      console.log({ "Error select data product": err });
    } else if (result.length > 0) {
      idProduct = "PRD" + (result.length + 1);
      db.query(
        sqlInsert,
        [
          idProduct,
          idUser,
          idCategory,
          name,
          description,
          price,
          stock,
          imagePath,
          status,
          rating,
          discount,
        ],
        (err, result) => {
          if (err) {
            console.log(err);
          } else {
            res.send({ success: "Success!", result });
          }
        }
      );
    } else {
      idProduct = "PRD1";
      db.query(
        sqlInsert,
        [
          idProduct,
          idUser,
          idCategory,
          name,
          description,
          price,
          stock,
          imagePath,
          status,
          rating,
          discount,
        ],
        (err, result) => {
          if (err) {
            console.log(err);
          } else {
            res.send({ success: "Success!", result });
          }
        }
      );
    }
  });
});

//Get Client Products
app.get("/api/client/getuserproduct/:username", (req, res) => {
  const username = req.params.username;

  const sqlSelect =
    "SELECT * FROM product WHERE id_user = ? AND status != 'deleted' ORDER BY id_product DESC";

  db.query(sqlSelect, username, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send(result);
    }
  });
});

// Get Products by category Client
app.get("/api/client/productsbycategory/:id", (req, res) => {
  const catId = req.params.id;
  const sqlSelect = "SELECT * FROM product WHERE id_category = ?";

  db.query(sqlSelect, catId, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Get Detail Product
app.get("/api/client/detailproduct/:id", (req, res) => {
  const idProduct = req.params.id;

  const sqlSelect = "SELECT * FROM product WHERE id_product = ?";

  db.query(sqlSelect, idProduct, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send(result);
    }
  });
});

// Edit Product no image
app.put("/api/client/editproduct", (req, res) => {
  const idProduct = req.body.idProduct;
  const name = req.body.name;
  const category = req.body.category;
  const description = req.body.description;
  const price = req.body.price;
  const stock = req.body.stock;
  const discount = req.body.discount;

  const sqlUpdate =
    "UPDATE product SET name = ?, id_category = ?, description = ?, price = ?, stock = ?, discount = ? WHERE id_product = ?";

  const values = [
    name,
    category,
    description,
    price,
    stock,
    discount,
    idProduct,
  ];

  db.query(sqlUpdate, values, (err, result) => {
    if (err) {
      res.send({ error: `error di server`, err });
    } else {
      res.send({ success: "Update Product Successfully!" });
    }
  });
});

// Edit Product with image
app.put("/api/client/epwithimage", upload.single("image"), (req, res) => {
  const idProduct = req.body.idProduct;
  const name = req.body.name;
  const imagePath = req.file.path;
  const category = req.body.category;
  const description = req.body.description;
  const price = req.body.price;
  const stock = req.body.stock;
  const discount = req.body.discount;

  const sqlUpdate =
    "UPDATE product SET name = ?, id_category = ?, description = ?, price = ?, stock = ?, img = ?, discount = ? WHERE id_product = ?";

  console.log(idProduct);
  const values = [
    name,
    category,
    description,
    price,
    stock,
    imagePath,
    discount,
    idProduct,
  ];

  db.query(sqlUpdate, values, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Update Product Successfully!" });
    }
  });
});

// Delete a product by ID
app.put("/api/client/deletestatus/:id", (req, res) => {
  const id = req.params.id;
  const today = req.body.today;

  const sqlUpdate =
    "UPDATE product SET status = 'deleted', delete_date = ? WHERE id_product = ?";

  db.query(sqlUpdate, [today, id], (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Item Deleted Successfully!" });
    }
  });
});

// Get All random* Available Products
app.get("/api/client/products", (req, res) => {
  const sqlSelect =
    "SELECT * FROM product WHERE status = 'available' ORDER BY RAND() LIMIT 10";

  db.query(sqlSelect, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Get all products by category
app.get("/api/client/getproductbycategory/:category", (req, res) => {
  const category = req.params.category;
  const sqlSelectCategory = "SELECT id_category FROM category WHERE name = ?";
  const sqlSelectProducts =
    "SELECT * FROM product WHERE id_category = ? ORDER BY RAND() LIMIT 10";
  let id_category = "";

  db.query(sqlSelectCategory, category, (err, result) => {
    if (err) {
      res.send({ error: "Error find category id", err });
    } else {
      id_category = result[0].id_category;
      if (id_category === "") {
        console.log("Category id is empty");
      } else {
        db.query(sqlSelectProducts, id_category, (err, resultProducts) => {
          if (err) {
            res.send({ error: "error get products", err });
          } else {
            res.send({ success: "success", resultProducts });
          }
        });
      }
    }
  });
});

// Get One Product
app.get("/api/client/getproductdetail/:id", (req, res) => {
  const pid = req.params.id;

  const sqlSelect = "SELECT * FROM product WHERE id_product = ?";

  db.query(sqlSelect, [pid], (err, result) => {
    // Perubahan di sini: pid dibungkus dalam array
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: result });
    }
  });
});

// Add Product to Cart
app.post("/api/client/addcart", (req, res) => {
  const idProduct = req.body.idProduct;
  const userLogin = req.body.userLogin;
  const quantity = req.body.quantity;
  const today = req.body.today;
  const addInfo = req.body.addInfo;
  const status = "active";

  const sqlInsert =
    "INSERT INTO cart (id_user, id_product, quantity, added_at, additional_info, status) VALUES (?,?,?,?,?,?)";

  const values = [userLogin, idProduct, quantity, today, addInfo, status];

  db.query(sqlInsert, values, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Successfully add to cart!" });
    }
  });
});

// Get Cart User
app.get("/api/client/getcart/:id", (req, res) => {
  const id = req.params.id;

  const sqlSelect = "SELECT * FROM cart WHERE id_user = ?";

  console.log();

  db.query(sqlSelect, id, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "success get cart user!", result });
    }
  });
});

// Get Cart Items
app.get("/api/client/cart/:id", (req, res) => {
  const id = req.params.id;

  const sqlSelect =
    "SELECT product.*, cart.* FROM product INNER JOIN cart ON product.id_product = cart.id_product WHERE cart.id_user = ? ORDER BY cart.id_cart DESC";

  db.query(sqlSelect, id, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success!", result });
    }
  });
});

// Delete Cart
app.delete("/api/client/deletecart/:id", (req, res) => {
  const id = req.params.id;

  const sqlDelete = "DELETE FROM cart WHERE id_cart = ?";

  db.query(sqlDelete, id, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success" });
    }
  });
});

// Place Orders
app.post("/api/client/orders", (req, res) => {
  let data = req.body;
  const user_id = data.username;
  let status = "pending";
  const address = data.address;
  const pyMethod = data.pyMethod;
  const bankNumber = data.bankNumber;
  const message = data.message;
  const shippingFee = data.delivery;
  const serviceFee = data.serviceFee;
  const totalPayment = data.totalPayment;
  const items = data.items;

  const sqlInsertOrders =
    "INSERT INTO orders (user_id, status, shipping_address, shipping_fee, service_fee, payment_method, bank_number, additional_info, total_price) VALUES (?,?,?,?,?,?,?,?,?)";

  const checkPendingOrder =
    "SELECT * FROM orders WHERE user_id = ? AND status = 'pending'";

  const valuesOrders = [
    user_id,
    status,
    address,
    shippingFee,
    serviceFee,
    pyMethod,
    bankNumber,
    message,
    totalPayment,
  ];

  // Check for existing pending order
  db.query(checkPendingOrder, user_id, (err, resultPending) => {
    if (resultPending.length > 0) {
      res.send({ pending: "You have an order waiting for payment!" });
    } else {
      db.query(sqlInsertOrders, valuesOrders, (err, result) => {
        if (err) {
          res.send({ error: "Orders Error", err });
        } else {
          const order_id = result.insertId;

          const sqlInsertOrderItems = `INSERT INTO order_items (order_id, product_id, quantity, additional_info, price) VALUES (?,?,?,?,?)`;

          items.forEach((item) => {
            const itemValues = [
              order_id,
              item.id_product,
              item.quantity,
              item.additional_info,
              item.price,
            ];
            db.query(sqlInsertOrderItems, itemValues, (itemErr, itemResult) => {
              if (itemErr) {
                res.send({
                  error: "Error when save detail product to database",
                  itemErr,
                });
              }
            });
          });

          const sqlDeleteCart = "DELETE FROM cart WHERE id_user = ?";
          const valuesDeleteCart = [user_id];
          db.query(
            sqlDeleteCart,
            valuesDeleteCart,
            (deleteErr, deleteResult) => {
              if (deleteErr) {
                res.send({
                  error: "Error when delete product from cart!",
                  deleteErr,
                });
              }
            }
          );

          res.send({ success: "Order successfully made" });
        }
      });
    }
  });
});

// Get Data Order Buyer
app.get("/api/client/buyer/orders/:username", (req, res) => {
  const username = req.params.username;
  const status = req.query.status;

  const sqlSelect =
    "SELECT o.order_id, o.user_id, o.status, oi.order_item_id, oi.product_id, oi.quantity, oi.additional_info, oi.price, p.id_product, p.img, p.name, s.id_user AS store_owner, s.name AS store_name FROM orders o JOIN order_items oi ON o.order_id = oi.order_id JOIN product p ON oi.product_id = p.id_product JOIN store s ON p.id_user = s.id_user WHERE o.user_id = ? AND o.status = ? ORDER BY o.order_id DESC";

  db.query(sqlSelect, [username, status], (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Get Data Payment Client Buyer
app.get("/api/client/buyer/payment/:username", (req, res) => {
  const username = req.params.username;

  const sqlSelect =
    "SELECT * FROM orders WHERE user_id = ? AND status = 'pending' ORDER BY order_id DESC";

  db.query(sqlSelect, username, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Payment Status Update
app.put("/api/client/buyer/confirm/:username", (req, res) => {
  const username = req.params.username;
  const ordersId = req.body.ordersId;

  const sqlUpdate =
    "UPDATE orders SET confirm_payment = 'check' WHERE order_id = ? AND user_id = ?";

  db.query(sqlUpdate, [ordersId, username], (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Thank you, your payment on checking!" });
    }
  });
});

app.get("/api/admin/categories", (req, res) => {
  const sqlSelect = "SELECT * FROM category";
  db.query(sqlSelect, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// =============================== Admin API ==========================
// Create Admin App
app.post("/api/admin/create", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  const fullName = req.body.fullName;
  const role = req.body.role;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (fullName.trim() === "") {
    res.status(400).json({ errorValidation: "Please input full name!" });
    return;
  } else if (username.trim() === "") {
    res.status(400).json({ errorValidation: "Please input username!" });
    return;
  } else if (!emailRegex.test(email)) {
    res.status(400).json({ errorValidation: "Please input valid email" });
    return;
  } else if (role.trim() === "") {
    res.status(400).json({ errorValidation: "Please select role admin!" });
    return;
  }

  const generateHash = async (password) => {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  };

  // Generate hash password
  let hashPass = "";
  try {
    hashPass = await generateHash(password);
  } catch (err) {
    console.log("Error generating hash", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  const sqlInsert =
    "INSERT INTO super_admin (username, password, email, full_name, role) VALUES (?,?,?,?,?)";

  db.query(
    sqlInsert,
    [username, hashPass, email, fullName, role],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.status(200).json({ success: "Success create admin", result });
      }
    }
  );
});

// Login to admin account
app.post("/api/admin/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const sqlSelect = "SELECT * FROM super_admin WHERE username = ?";

  db.query(sqlSelect, username, async (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    if (result.length === 0) {
      res.send({ error: "Invalid username or password" });
      return;
    }

    const hashedPassword = result[0].password;

    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      if (!isMatch) {
        res.send({ error: "Invalid username or password" });
        return;
      }

      const token = jwt.sign({ userId: result[0].id }, "secret_key", {
        expiresIn: "1h",
      });

      res.status(200).json({ success: "Login successfully", token, username });
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
});

// Add Category
const storageIconCategory = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/icons");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadIconsCategory = multer({ storage: storageIconCategory });

app.post(
  "/api/admin/category",
  uploadIconsCategory.single("icon"),
  (req, res) => {
    const name = req.body.name;
    const description = req.body.description;
    const iconPath = req.file.path;
    const sqlGetData = "SHOW TABLE STATUS LIKE 'category'";
    const sqlInsert =
      "INSERT INTO category (id_category, name, description, icon) VALUES (?,?,?,?)";
    let id_category = "";

    db.query(sqlGetData, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        id_category = "CTG" + (result[0].Rows + 1);
        if (id_category === "") {
          console.log("Error set category");
        } else if (name === "") {
          res.send({ error: "Category name can't be empty!" });
        } else if (description === "") {
          res.send({ error: "Please add description" });
        } else {
          db.query(
            sqlInsert,
            [id_category, name, description, iconPath],
            (err, result) => {
              if (err) {
                res.send({ error: err });
              } else {
                res.send({ success: "Success!" });
              }
            }
          );
        }
      }
    });
  }
);
