const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const util = require("util");

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
  res.send("RESTAPI ONLINE SHOP!");
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
  const address = req.body.address;
  const phone = req.body.phone;
  const email = req.body.email;

  const sqlInsert =
    "INSERT INTO store (id_user, name, description, address, phone, email) VALUES (?,?,?,?,?,?)";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (storeName === "") {
    res.send({ error: "Please input your Store name!" });
  } else if (description === "") {
    res.send({ error: "Please add description store!" });
  } else if (address === "") {
    res.send({ error: "Please Input Your Store Address!" });
  } else if (phone === "") {
    res.send({ error: "Please Input Your Store Phone Number!" });
  } else if (email === "" || !emailRegex.test(email)) {
    res.send({ error: "Please Input Your Store Valid Email!" });
  } else {
    db.query(
      sqlInsert,
      [username, storeName, description, address, phone, email],
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

  const sqlSelect = "SHOW TABLE STATUS LIKE 'product'";

  const sqlInsert =
    "INSERT INTO product (id_product, id_user, id_category, name, description, price, stock, img, status, rating, discount) VALUES (?,?,?,?,?,?,?,?,?,?,?)";

  let idProduct = "";

  db.query(sqlSelect, (err, result) => {
    if (err) {
      console.log({ "Error select data product": err });
    } else {
      idProduct = "PRD" + (result[0].Rows + 1);
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
            res.send({ error: "error here" + err });
          } else {
            res.send({ success: "Success!" });
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
const query = util.promisify(db.query).bind(db);
app.get("/api/client/productsbycategory/:id", async (req, res) => {
  const catId = req.params.id;
  const sqlSelect =
    "SELECT p.*, AVG(c.rating) AS average_rating, IFNULL(s.total_sold, 0) AS total_sold FROM product p LEFT JOIN comments c ON p.id_product = c.id_product LEFT JOIN (SELECT oi.product_id, COUNT(oi.order_item_id) AS total_sold FROM order_items oi GROUP BY oi.product_id) s ON p.id_product = s.product_id WHERE id_category = ? GROUP BY p.id_product ORDER BY RAND()";
  const sqlSelectCateGoryName =
    "SELECT name FROM category WHERE id_category = ?";

  try {
    const resultCatName = await query(sqlSelectCateGoryName, catId);
    const categoryName = resultCatName[0].name;

    const result = await query(sqlSelect, catId);

    res.send({ success: "Success", result, categoryName });
  } catch (err) {
    console.log(err);
    res.send({ error: err });
  }
});

// Search Products by name
app.get("/api/client/products/search", async (req, res) => {
  const productName = req.query.name;

  if (!productName) {
    return res.send({ error: "Product name is required" });
  }

  const sqlSearch = "SELECT * FROM product WHERE name LIKE ?";
  const searchValue = `%${productName}%`;

  try {
    const result = await query(sqlSearch, [searchValue]);
    res.send({ success: "Success", result });
  } catch (err) {
    res.send(err);
  }
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
    "SELECT p.*, AVG(c.rating) AS average_rating, IFNULL(s.total_sold, 0) AS total_sold FROM product p LEFT JOIN comments c ON p.id_product = c.id_product LEFT JOIN (SELECT oi.product_id, COUNT(oi.order_item_id) AS total_sold FROM order_items oi GROUP BY oi.product_id) s ON p.id_product = s.product_id WHERE status = 'available' GROUP BY p.id_product ORDER BY RAND()";

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
    "SELECT p.*, AVG(c.rating) AS average_rating, IFNULL(s.total_sold, 0) AS total_sold FROM product p LEFT JOIN comments c ON p.id_product = c.id_product LEFT JOIN (SELECT oi.product_id, COUNT(oi.order_item_id) AS total_sold FROM order_items oi GROUP BY oi.product_id) s ON p.id_product = s.product_id WHERE id_category = ? GROUP BY p.id_product ORDER BY RAND() LIMIT 10";
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

  const sqlSelect =
    "SELECT p.*, AVG(c.rating) AS average_rating, IFNULL(s.total_sold, 0) AS total_sold FROM product p LEFT JOIN comments c ON p.id_product = c.id_product LEFT JOIN (SELECT oi.product_id, COUNT(oi.order_item_id) AS total_sold FROM order_items oi GROUP BY oi.product_id) s ON p.id_product = s.product_id WHERE p.id_product = ? GROUP BY p.id_product";

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
  const addInfo = req.body.addInfo;
  const status = "active";

  const sqlInsert =
    "INSERT INTO cart (id_user, id_product, quantity, additional_info, status) VALUES (?,?,?,?,?)";

  const values = [userLogin, idProduct, quantity, addInfo, status];

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

          const sqlInsertOrderItems = `INSERT INTO order_items (order_id, product_id, quantity, additional_info, price, discount) VALUES (?,?,?,?,?,?)`;

          items.forEach((item) => {
            const itemValues = [
              order_id,
              item.id_product,
              item.quantity,
              item.additional_info,
              item.price,
              item.discount,
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
    "SELECT o.order_id, o.user_id, o.status, oi.order_item_id, oi.status AS status_oi, oi.product_id, oi.quantity, oi.additional_info, oi.price, p.id_product, p.img, p.name, p.discount, s.id_user AS store_owner, s.name AS store_name FROM orders o JOIN order_items oi ON o.order_id = oi.order_id JOIN product p ON oi.product_id = p.id_product JOIN store s ON p.id_user = s.id_user WHERE o.user_id = ? AND oi.status = ? ORDER BY o.order_id DESC";

  const sqlSelectWithShipping =
    "SELECT o.order_id, o.user_id, o.status, oi.order_item_id, oi.status AS status_oi, oi.product_id, oi.quantity, oi.additional_info, oi.price, p.id_product, p.img, p.name, p.discount, s.id_user AS store_owner, s.name AS store_name, sp.carrier, sp.tracking_number FROM orders o JOIN order_items oi ON o.order_id = oi.order_id JOIN product p ON oi.product_id = p.id_product JOIN store s ON p.id_user = s.id_user JOIN shipping sp ON oi.order_item_id = sp.order_item_id WHERE o.user_id = ? AND oi.status = ? ORDER BY o.order_id DESC";

  if (status === "shipping") {
    db.query(sqlSelectWithShipping, [username, status], (err, result) => {
      if (err) {
        res.send({ error: err });
      } else {
        res.send({ success: "Success", result });
      }
    });
  } else {
    db.query(sqlSelect, [username, status], (err, result) => {
      if (err) {
        res.send({ error: err });
      } else {
        res.send({ success: "Success", result });
      }
    });
  }
});

// Buyer Accept Order Already Arrived
app.put("/api/client/acceptorder/:id", (req, res) => {
  const id = req.params.id;
  const sqlUpdate =
    "UPDATE order_items SET status = 'completed' WHERE order_item_id = ?";

  db.query(sqlUpdate, id, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Thank you !" });
    }
  });
});

// Seller Get Total Row Data Pending Paid Request Order
app.get("/api/client/seller/:username/:status", (req, res) => {
  const username = req.params.username;
  const status = req.params.status;

  const sqlSelect =
    "SELECT COUNT(*) AS total_rows FROM order_items oi JOIN product p ON oi.product_id = p.id_product WHERE p.id_user = ? AND oi.status = ?";

  db.query(sqlSelect, [username, status], (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Seller get Data Pending Paid Request Order
app.get("/api/client/seller/:username", (req, res) => {
  const username = req.params.username;
  const sqlSelect =
    "SELECT o.order_id, o.shipping_address, o.additional_info, oi.order_item_id, oi.quantity, oi.additional_info AS product_info, p.name, p.img FROM orders o JOIN order_items oi ON o.order_id = oi.order_id JOIN product p ON oi.product_id = p.id_product WHERE p.id_user = ? AND oi.status = 'request' ORDER BY o.order_id DESC";

  db.query(sqlSelect, username, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Seller get Data Shipping Order
app.get("/api/client/sellershipping/:username", (req, res) => {
  const username = req.params.username;
  const sqlSelect =
    "SELECT o.order_id, o.shipping_address, o.additional_info, oi.order_item_id, oi.quantity, oi.additional_info AS product_info, p.name, p.img FROM orders o JOIN order_items oi ON o.order_id = oi.order_id JOIN product p ON oi.product_id = p.id_product WHERE p.id_user = ? AND oi.status = 'shipping' ORDER BY o.order_id DESC";

  db.query(sqlSelect, username, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Seller get Data Complete Order
app.get("/api/client/sellercomplete/:username", (req, res) => {
  const username = req.params.username;
  const sqlSelect =
    "SELECT o.order_id, o.shipping_address, o.additional_info, oi.order_item_id, oi.quantity, oi.additional_info AS product_info, p.name, p.img FROM orders o JOIN order_items oi ON o.order_id = oi.order_id JOIN product p ON oi.product_id = p.id_product WHERE p.id_user = ? AND oi.status = 'completed' ORDER BY o.order_id DESC";

  db.query(sqlSelect, username, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Post Data Seller Shipping Order
app.post("/api/seller/shipping", (req, res) => {
  const order_id = req.body.order_id;
  const order_item_id = req.body.order_item_id;
  const carrier = req.body.carrier;
  const tracking_number = req.body.resi;
  const address = req.body.address;
  const sqlInsert =
    "INSERT INTO shipping (order_item_id, carrier, tracking_number, shipping_address) VALUES (?,?,?,?)";
  const sqlUpdate =
    "UPDATE order_items SET status = 'shipping' WHERE order_item_id = ?";
  const values = [order_item_id, carrier, tracking_number, address];

  if (carrier === "" || order_id === "") {
    res.send({ error: "Please input the field!" });
    return;
  }

  db.query(sqlUpdate, order_item_id, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      db.query(sqlInsert, values, (err, result) => {
        if (err) {
          res.send({ error: "Error Input data!" });
        } else {
          res.send({
            success: "Thank you, Just wait your data has been Checking!",
          });
        }
      });
    }
  });
});

// Get Data Payment Client Buyer
app.get("/api/client/buyer/payment/:username", (req, res) => {
  const username = req.params.username;

  const sqlSelect =
    "SELECT o.*, b.name FROM orders o JOIN bank b ON o.bank_number = b.number WHERE o.user_id = ? AND o.status = 'pending' ORDER BY o.order_id DESC";

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

app.post("/api/client/rating", (req, res) => {
  const rating = req.body.rating;
  const comment = req.body.comment;
  const username = req.body.username;
  const idProductRate = req.body.idProductRate;
  const idOrderItemRate = req.body.idOrderItemRate;
  const sqlUpdateOrderItems =
    "UPDATE order_items SET status = 'history' WHERE order_item_id = ?";
  const sqlInsert =
    "INSERT INTO comments (id_product, id_user, comment, rating) VALUES (?,?,?,?)";
  const values = [idProductRate, username, comment, rating];

  db.query(sqlInsert, values, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      db.query(sqlUpdateOrderItems, idOrderItemRate, (err, result) => {
        if (err) {
          res.send({ error: err });
        } else {
          res.send({ success: "Thank you for your rating!" });
        }
      });
    }
  });
});

// Get Bank Data Client Checkout process
app.get("/api/client/bankpayment", (req, res) => {
  const sqlGetData = "SELECT * FROM bank";
  db.query(sqlGetData, (err, result) => {
    if (err) {
      console.log(err);
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

// Get admin data
app.get("/api/admin/:username", (req, res) => {
  const username = req.params.username;
  const sqlSelect = "SELECT full_name FROM super_admin WHERE username = ?";
  db.query(sqlSelect, username, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
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

// Add Bank list for payment thirdparty
app.post("/api/admin/bank", (req, res) => {
  const bank = req.body.bank;
  const name = req.body.name;
  const number = req.body.number;
  const sqlInsert = "INSERT INTO bank (bank, name, number) VALUES (?,?,?)";

  db.query(sqlInsert, [bank, name, number], (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success!" });
    }
  });
});

// Get Bank Data Admin
app.get("/api/adminget/bank", (req, res) => {
  const sqlGetData = "SELECT * FROM bank";
  db.query(sqlGetData, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Delete Bank
app.delete("/api/admin/bank/:id", (req, res) => {
  const id = req.params.id;
  const sqlDelete = "DELETE FROM bank WHERE id = ?";

  db.query(sqlDelete, id, (err, result) => {
    if (err) {
      console.log(err);
      res.send({ error: err });
    } else {
      res.send({ success: "Success" });
    }
  });
});

// Get Check Payment
app.get("/api/admin/orders/check", (req, res) => {
  const sqlSelect = "SELECT * FROM orders WHERE confirm_payment = 'check'";
  db.query(sqlSelect, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Get Waiting for Payment
app.get("/api/admin/orders/pending", (req, res) => {
  const sqlSelect = "SELECT * FROM orders WHERE status = 'pending'";
  db.query(sqlSelect, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Get package, shipping, and complete Orders
app.get("/api/admin/orders/packaged/:status", (req, res) => {
  const status = req.params.status;
  const sqlSelect = "SELECT * FROM order_items WHERE status = ?";
  db.query(sqlSelect, status, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Get Data Payment Confirm
app.get("/admin/orderpay", (req, res) => {
  const sqlSelect = "SELECT * FROM orders WHERE confirm_payment = 'check'";
  db.query(sqlSelect, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Approve Payment Order
app.put("/admin/confirmpay/:id", (req, res) => {
  const id = req.params.id;
  const sqlUpdateOrders =
    "UPDATE orders SET status = 'paid', confirm_payment = 'confirm' WHERE order_id = ?";
  const sqlUpdateOrderItems =
    "UPDATE order_items SET status = 'request' WHERE order_id = ?";

  db.query(sqlUpdateOrders, id, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      db.query(sqlUpdateOrderItems, id, (err, resultItem) => {
        if (err) {
          res.send({ error: err });
        } else {
          res.send({ success: "Success", result, resultItem });
        }
      });
    }
  });
});

// Admin Check Order on Packaging
app.get("/admin/orderpack", (req, res) => {
  const sqlSelect =
    "SELECT oi.order_item_id, oi.order_id, oi.product_id, oi.quantity, oi.additional_info, p.id_user AS seller, p.name, p.img FROM order_items oi JOIN product p ON oi.product_id = p.id_product  WHERE oi.status = 'request'";
  db.query(sqlSelect, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Admin Check Order on Shipping
app.get("/admin/ordership", (req, res) => {
  const sqlSelect =
    "SELECT oi.order_item_id, oi.product_id, oi.quantity, oi.additional_info, oi.order_id, p.id_user AS seller, p.name, p.img, sp.carrier, sp.tracking_number FROM order_items oi JOIN product p ON oi.product_id = p.id_product JOIN shipping sp ON oi.order_item_id = sp.order_item_id WHERE oi.status = 'shipping'";
  db.query(sqlSelect, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Admin Check Order Finished
app.get("/admin/orderdone", (req, res) => {
  const sqlSelect =
    "SELECT oi.order_item_id, oi.product_id, oi.quantity, oi.order_id, oi.additional_info, p.id_user AS seller, p.name, p.img, sp.carrier, sp.tracking_number FROM order_items oi JOIN product p ON oi.product_id = p.id_product JOIN shipping sp ON oi.order_item_id = sp.order_item_id WHERE oi.status = 'completed'";
  db.query(sqlSelect, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Admin get Order Detail
app.get("/admin/order/details/:product/:orderitem/:order", (req, res) => {
  const idProduct = req.params.product;
  const idOrderItem = req.params.orderitem;
  const idOrder = req.params.order;
  const sqlSelect =
    "SELECT oi.quantity, oi.additional_info, oi.status, oi.price, p.name, p.img, p.id_user AS seller, p.discount, o.shipping_address, o.order_date, o.payment_method, o.bank_number, o.user_id AS buyer, o.total_price, s.carrier, s.tracking_number, s.shipped_date FROM order_items oi JOIN product p ON oi.product_id = p.id_product JOIN orders o ON oi.order_id = o.order_id LEFT JOIN shipping s ON oi.order_item_id = s.order_item_id WHERE oi.order_item_id = ? AND oi.product_id = ? AND oi.order_id = ?";

  db.query(sqlSelect, [idOrderItem, idProduct, idOrder], (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Admin Search by Username Client
app.get("/admin/search/:username", (req, res) => {
  const username = req.params.username;
  const sqlSelect =
    "select u.fullname, u.username, u.number, u.email, u.gender, u.birthday, u.address, u.join_date, str.name AS store_name FROM user u LEFT JOIN store str ON u.username = str.id_user WHERE u.username = ?";

  db.query(sqlSelect, username, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else if (result.length < 1) {
      res.send({ notFound: `username "${username}" not found` });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Admin Add Banner
app.post("/admin/banner", (req, res) => {
  const { url, link, title } = req.body;
  const sqlInsert =
    "INSERT INTO baner (url_image, link, title) VALUES (?, ?, ?)";

  if (url === "" || link === "" || title === "") {
    res.send({ error: "Please fill all fields" });
    return;
  }

  db.query(sqlInsert, [url, link, title], (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Admin get Banner
app.get("/admin/banner", (req, res) => {
  const sqlSelect = "SELECT * FROM baner";
  db.query(sqlSelect, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});

// Admin Delete banner
app.delete("/admin/banner/:id", (req, res) => {
  const id = req.params.id;
  const sqlDelete = "DELETE FROM baner WHERE id_baner = ?";
  db.query(sqlDelete, id, (err, result) => {
    if (err) {
      res.send({ error: err });
    } else {
      res.send({ success: "Success", result });
    }
  });
});
