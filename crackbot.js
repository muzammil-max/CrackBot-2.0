const {
  Client,
  GatewayIntentBits,
  GuildMember,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
  Partials,
  ActivityType,
  REST,
  Routes,
  Intents,
} = require("discord.js");

// Detailed client setup with specific intents and partials
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.User],
});

const { spawn } = require("child_process");

const fs = require("fs");
const { type } = require("os");
const path = require("path");
const Canvas = require("canvas");
const { log } = require("console");
const Discord = require("discord.js");
const canvafy = require("canvafy");
const { createCanvas } = require("canvas");
const math = require("mathjs");
const plotly = require("plotly");
const puppeteer = require("puppeteer");
// const { REST } = require("@discordjs/rest");
// const { Routes } = require("discord-api-types/v9");
const axios = require("axios");
const sharp = require("sharp");
// const fetch = require("node-fetch");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

//run the main.py
const pythonProcess = spawn("python", ["main.py"]);

// Listen for Python script output
pythonProcess.stdout.on("data", (data) => {
  console.log(`Python stdout: ${data}`);
});

pythonProcess.stderr.on("data", (data) => {
  console.error(`Python stderr: ${data}`);
});

// When the Python script exits
pythonProcess.on("close", (code) => {
  console.log(`Python process exited with code ${code}`);
});

//!welcome initiliazation
var welcomeCanvas = {};
welcomeCanvas.create = Canvas.createCanvas(1024, 500);
welcomeCanvas.context = welcomeCanvas.create.getContext("2d");
welcomeCanvas.context.font = "72px sans-serif";
welcomeCanvas.context.fillStyle = "#ffffff";

// Array of images for random selection (updated paths)
const images = [
  "./img/img2.jpeg",
  "./img/img3.jpeg",
  "./img/img4.jpeg",
  "./img/img.png",
];

// Filter out any files that don’t exist
const validImages = images.filter((image) => fs.existsSync(image));

if (validImages.length === 0) {
  console.error("No valid images found in the img folder.");
}

// Function to load a random image
function loadRandomImage() {
  const randomIndex = Math.floor(Math.random() * validImages.length);
  return Canvas.loadImage(validImages[randomIndex]);
}
//!translator
// Define the Slash Command for translation

// Event: When a new member joins
client.on("guildMemberAdd", async (member) => {
  try {
    // Load a random background image
    const img = await loadRandomImage();

    // Draw the selected background image on the canvas
    welcomeCanvas.context.drawImage(img, 0, 0, 1024, 500);
    welcomeCanvas.context.fillText("Welcome", 360, 360);
    welcomeCanvas.context.beginPath();
    welcomeCanvas.context.arc(512, 166, 128, 0, Math.PI * 2, true);
    welcomeCanvas.context.stroke();
    welcomeCanvas.context.fill();

    // Create a welcome image using canvafy
    const welcome = await new canvafy.WelcomeLeave()
      .setAvatar(
        member.user.displayAvatarURL({ forceStatic: true, extension: "png" })
      )
      .setBackground(
        "image",
        validImages[Math.floor(Math.random() * validImages.length)]
      )
      .setTitle(`Welcome!`)
      .setDescription(
        `Hi ${member.user.username}, we hope you will have a great time here!`,
        "#FFFFFF"
      )
      .setBorder("#2a2e35")
      .setAvatarBorder("#FFFFFF")
      .setOverlayOpacity(0.1)
      .build();

    // Get the total member count
    const memberCount = member.guild.memberCount;

    // Send welcome message with random image background
    member.guild.channels.cache.get("1305567907069034547").send({
      content: `${member} has joined! You’re our **${memberCount}th** member—let’s focus, study, and achieve big goals!`,
      files: [
        {
          attachment: welcome,
          name: `welcome-${member.id}.png`,
        },
      ],
    });
  } catch (error) {
    console.error("Error in guildMemberAdd event:", error);
  }
});

//! Tetris
const canvasWidth = 200;
const canvasHeight = 400;

// Tetris grid dimensions
const gridWidth = 10;
const gridHeight = 20;
const blockSize = 20;

// Define Tetris piece shapes (tetrominoes)
const pieces = [
  {
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: "cyan",
  }, // T shape
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "yellow",
  }, // O shape
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "green",
  }, // S shape
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "red",
  }, // Z shape
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "blue",
  }, // L shape
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "orange",
  }, // J shape
  { shape: [[1, 1, 1, 1]], color: "purple" }, // I shape
];

// Initialize grid (0 means empty)
let grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(0));

// Current piece and its position
let piece = generateNewPiece();

// Start game and send initial grid
client.once("ready", () => {
  console.log("Bot is online!");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignore bot messages

  // If the message is "!tetris", start the game
  if (message.content.toLowerCase() === "!tetris") {
    await startTetrisGame(message);
  }
});

async function startTetrisGame(message) {
  // Send the initial game state (grid + piece)
  const tetrisImage = drawTetrisGrid();
  const gameMessage = await message.reply({
    content: "Here is your Tetris grid:",
    files: [tetrisImage],
  });

  // Add reactions for controls (move left, right, down, rotate)
  await gameMessage.react("⬅️");
  await gameMessage.react("➡️");
  await gameMessage.react("⬇️");
  await gameMessage.react("🔄");

  // Collect reactions for user input
  const filter = (reaction, user) =>
    ["⬅️", "➡️", "⬇️", "🔄"].includes(reaction.emoji.name) && !user.bot;
  const collector = gameMessage.createReactionCollector({
    filter,
    time: 60000,
  }); // Collect for 1 minute

  collector.on("collect", async (reaction, user) => {
    switch (reaction.emoji.name) {
      case "⬅️": // Move left
        movePiece(-1, 0);
        break;
      case "➡️": // Move right
        movePiece(1, 0);
        break;
      case "⬇️": // Move down
        movePiece(0, 1);
        break;
      case "🔄": // Rotate
        rotatePiece();
        break;
    }
    reaction.users.remove(user); // Remove user's reaction after it is processed

    // If piece can't move down, place it and generate a new one
    if (!movePiece(0, 1)) {
      placePiece();
      if (!canMove(piece.x, piece.y, piece.shape)) {
        // Game over if we can't place the new piece
        collector.stop(); // Stop the game loop
        gameMessage.edit("Game Over! Refresh to play again.");
      } else {
        piece = generateNewPiece();
      }
      redrawGame(gameMessage);
    } else {
      redrawGame(gameMessage); // Redraw the grid if piece moves
    }
  });
}

// Function to generate a new random piece
function generateNewPiece() {
  const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
  return {
    shape: randomPiece.shape,
    x: Math.floor(gridWidth / 2) - Math.floor(randomPiece.shape[0].length / 2), // Center it horizontally
    y: 0,
    color: randomPiece.color,
  };
}

// Function to move the piece on the grid
function movePiece(dx, dy) {
  const newX = piece.x + dx;
  const newY = piece.y + dy;

  // Check if the move is valid (within bounds and no collision)
  if (canMove(newX, newY, piece.shape)) {
    piece.x = newX;
    piece.y = newY;
    return true;
  }
  return false;
}

// Function to check if the piece can move (no collision)
function canMove(x, y, shape) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        if (
          x + col < 0 ||
          x + col >= gridWidth ||
          y + row >= gridHeight ||
          grid[y + row][x + col] === 1
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

// Function to rotate the piece
function rotatePiece() {
  const rotatedShape = piece.shape[0]
    .map((_, index) => piece.shape.map((row) => row[index]))
    .reverse(); // Rotate 90 degrees

  if (canMove(piece.x, piece.y, rotatedShape)) {
    piece.shape = rotatedShape;
  }
}

// Function to place the piece permanently on the grid
function placePiece() {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] === 1) {
        grid[piece.y + row][piece.x + col] = 1; // Place piece in the grid
      }
    }
  }

  // Check for line clearing
  clearFullLines();
}

// Function to clear full lines
function clearFullLines() {
  for (let row = 0; row < gridHeight; row++) {
    if (grid[row].every((cell) => cell === 1)) {
      // Shift all rows down
      for (let y = row; y > 0; y--) {
        grid[y] = [...grid[y - 1]]; // Copy the previous row
      }
      grid[0] = Array(gridWidth).fill(0); // Reset top row
    }
  }
}

// Function to redraw the game grid and send the updated image
async function redrawGame(gameMessage) {
  const updatedTetrisImage = drawTetrisGrid();
  await gameMessage.edit({
    content: "Here is your updated Tetris grid:",
    files: [updatedTetrisImage],
  });
}

// Function to draw the Tetris grid and the current piece
function drawTetrisGrid() {
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw the grid cells (filled blocks)
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (grid[y][x] === 1) {
        ctx.fillStyle = "blue"; // Filled blocks
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        ctx.strokeStyle = "white";
        ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
      }
    }
  }

  // Draw the current piece on top of the grid
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] === 1) {
        ctx.fillStyle = piece.color; // Current piece color
        ctx.fillRect(
          (piece.x + col) * blockSize,
          (piece.y + row) * blockSize,
          blockSize,
          blockSize
        );
        ctx.strokeStyle = "white";
        ctx.strokeRect(
          (piece.x + col) * blockSize,
          (piece.y + row) * blockSize,
          blockSize,
          blockSize
        );
      }
    }
  }

  // Return the image as a buffer to send it in Discord
  return canvas.toBuffer();
}
//? Ai in CrackBot {FAILED TO ADD AI :( }
// Generate Response from Gemini API (Gemini 1.5 Flash)
// const APIKEY = "AIzaSyANwl-a_docTEM7jk5NsMI_LISD7_h2060";
// const genAI = new GoogleGenerativeAI(APIKEY);
// async function generateResponse(prompt) {
//   try {
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     const result = await model.generateContent(prompt); // Simplified call
//     const response =
//       result?.candidates?.[0]?.content?.parts
//         ?.map((part) => part.text)
//         .join("") || "I couldn't generate a valid response.";
//     return formatLatexResponse(response);
//   } catch (error) {
//     console.error("Error generating response:", error.message);
//     return "I couldn't generate a response. Please try again!";
//   }
// }
// // Format LaTeX Responses
// function formatLatexResponse(text) {
//   text = text.replace(/\$([^$]+)\$/g, "`$1`"); // Inline LaTeX
//   text = text.replace(/\$\$([^$]+)\$\$/g, "```latex\n$1\n```"); // Block LaTeX
//   return text;
// }

// // Generate Graph using Chart.js
// async function generateGraph(expression) {
//   const width = 800; // Width of the graph
//   const height = 600; // Height of the graph
//   const chartCallback = () => {};
//   const chartJSNodeCanvas = new ChartJSNodeCanvas({
//     width,
//     height,
//     chartCallback,
//   });

//   try {
//     const x = Array.from({ length: 10 }, (_, i) => i + 1);
//     const y = x.map((val) => eval(expression.replace(/x/g, val)));

//     const configuration = {
//       type: "line",
//       data: {
//         labels: x,
//         datasets: [
//           {
//             label: "Graph",
//             data: y,
//             borderColor: "rgba(75, 192, 192, 1)",
//             backgroundColor: "rgba(75, 192, 192, 0.2)",
//             fill: true,
//           },
//         ],
//       },
//     };

//     const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
//     return buffer;
//   } catch (error) {
//     console.error("Error generating graph:", error);
//     return null;
//   }
// }

// // Commands
// client.on("messageCreate", async (message) => {
//   if (message.author.bot) return;

//   const content = message.content;

//   if (content.startsWith("!ask ")) {
//     const question = content.slice(5).trim();
//     await message.channel.send("Thinking... ⌛");
//     const response = await generateResponse(question);
//     await message.channel.send(response);
//   }

//   if (content.startsWith("!askbot ")) {
//     const question = content.slice(8).trim();
//     await message.channel.send("Thinking... ⌛");
//     const response = await generateResponse(question);
//     await message.channel.send(response);
//   }

//   if (content.startsWith("!graph ")) {
//     const expression = content.slice(7).trim();
//     await message.channel.send(
//       `Generating graph for expression: \`${expression}\``
//     );
//     const graphBuffer = await generateGraph(expression);
//     if (graphBuffer) {
//       const fileName = "graph.png";
//       fs.writeFileSync(fileName, graphBuffer);
//       await message.channel.send({ files: [fileName] });
//       fs.unlinkSync(fileName); // Cleanup the file after sending
//     } else {
//       await message.channel.send(
//         "Error generating graph. Please check your expression!"
//       );
//     }
//   }
// });

client.once("ready", () => {
  console.log(`${client.user.tag} is ready to roll!`);
});

//!  Graphs Plotter [By Muzammil]--------------------------------------

async function plotGraph(
  expressions = ["x^2"],
  filename = "graph.png",
  is3D = false,
  isPolar = false
) {
  const xValues = Array.from({ length: 500 }, (_, i) => (i - 250) / 50); // X values from -5 to 5
  const yValues = is3D
    ? Array.from({ length: 500 }, (_, i) => (i - 250) / 50)
    : [];
  const thetaValues = Array.from(
    { length: 500 },
    (_, i) => (i * Math.PI * 2) / 500
  ); // θ from 0 to 2π

  const data = isPolar
    ? expressions.map((expression, index) => {
        const rValues = thetaValues.map((theta) => {
          try {
            // Clean up the expression to ensure proper multiplication handling
            const fixedExpression = expression
              .replace(/theta/g, `(${theta})`) // Replace 'theta' with numeric value
              .replace(/(\d)([a-zA-Z])/g, "$1 * $2") // Add explicit multiplication: 2cos -> 2 * cos
              .replace(/(\))(\()/g, "$1 * $2"); // Add multiplication between adjacent parentheses

            return math.evaluate(fixedExpression);
          } catch (error) {
            console.error("Evaluation error for polar graph:", error);
            return NaN;
          }
        });
        return {
          r: rValues,
          theta: thetaValues.map((theta) => (theta * 180) / Math.PI), // Convert θ to degrees
          mode: "lines",
          type: "scatterpolar",
          name: `Polar Graph ${index + 1}: ${expression}`,
          line: { width: 2 },
        };
      })
    : is3D
    ? []
    : expressions.map((expression, index) => {
        const yValues = xValues.map((x) => {
          try {
            return math.evaluate(expression.replace(/x/g, `(${x})`)); // Evaluate expression for x
          } catch {
            return NaN;
          }
        });
        return {
          x: xValues,
          y: yValues,
          mode: "lines",
          name: `Graph ${index + 1}: ${expression}`,
          line: { width: 2 },
        };
      });

  if (is3D && !isPolar) {
    for (let expression of expressions) {
      const zMatrix = [];
      for (let x of xValues) {
        const zRow = [];
        for (let y of yValues) {
          try {
            const z = math.evaluate(
              expression.replace(/x/g, `(${x})`).replace(/y/g, `(${y})`)
            );
            zRow.push(z);
          } catch {
            zRow.push(NaN);
          }
        }
        zMatrix.push(zRow);
      }
      data.push({
        x: xValues,
        y: yValues,
        z: zMatrix,
        type: "surface",
        colorscale: "Earth",
        showscale: true,
        name: `3D Graph: ${expression}`,
      });
    }
  }

  const layout = isPolar
    ? {
        title: "Polar Graph By CrackBot",
        polar: {
          radialaxis: { title: "r" },
          angularaxis: { title: "θ (degrees)" },
        },
        width: 800,
        height: 600,
      }
    : is3D
    ? {
        title: "3D Graph by CrackBot",
        scene: {
          xaxis: { title: "X-axis" },
          yaxis: { title: "Y-axis" },
          zaxis: { title: "Z-axis" },
          camera: { eye: { x: 1.5, y: 1.5, z: 1.5 } },
        },
        width: 800,
        height: 600,
      }
    : {
        title: "2D Graph by CrackBot",
        xaxis: { title: "X-axis" },
        yaxis: { title: "Y-axis" },
        width: 800,
        height: 600,
      };
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    </head>
    <body>
        <div id="plot" style="width:800px;height:600px;"></div>
        <script>
            const data = ${JSON.stringify(data)};
            const layout = ${JSON.stringify(layout)};
            Plotly.newPlot('plot', data, layout);
        </script>
    </body>
    </html>
  `;

  await page.setContent(htmlContent);
  await page.waitForSelector("#plot", { timeout: 5000 });
  await page.screenshot({ path: filename });

  await browser.close();
  return filename;
}

//send loading message before making graph
//  function for loading message
async function sendLoadingMessage(channel) {
  const loadingMessage = await channel.send({
    content:
      "**Generating graph, please wait...** <a:loading:1317398943713202218>", // Replace with your animated emoji ID
  });
  return loadingMessage;
}
// Modified command handlers
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!2dgraph ")) {
    const match = message.content.match(/`([^`]+)`/);
    let expressions = match
      ? match[1].split(",").map((expr) => expr.trim())
      : ["x^2"];

    const loadingMessage = await sendLoadingMessage(message.channel);

    try {
      const filename = await plotGraph(expressions, "graph.png", false, false);
      await loadingMessage.delete(); // Remove the loading message
      await message.channel.send({
        files: [{ attachment: filename, name: "graph.png" }],
      });
    } catch (error) {
      console.error(error);
      await loadingMessage.edit(
        "❌ There was an error generating the 2D graph."
      );
    }
  }

  if (message.content.startsWith("!3dgraph ")) {
    const match = message.content.match(/`([^`]+)`/);
    let expressions = match
      ? match[1].split(",").map((expr) => expr.trim())
      : ["x^2 + y^2"];

    const loadingMessage = await sendLoadingMessage(message.channel);

    try {
      const filename = await plotGraph(expressions, "graph.png", true, false);
      await loadingMessage.delete(); // Remove the loading message
      await message.channel.send({
        files: [{ attachment: filename, name: "graph.png" }],
      });
    } catch (error) {
      console.error(error);
      await loadingMessage.edit(
        "❌ There was an error generating the 3D graph."
      );
    }
  }

  if (message.content.startsWith("!polargraph ")) {
    const match = message.content.match(/`([^`]+)`/);
    let expressions = match
      ? match[1].split(",").map((expr) => expr.trim())
      : ["cos(θ)"];

    const loadingMessage = await sendLoadingMessage(message.channel);

    try {
      const filename = await plotGraph(
        expressions,
        "polar_graph.png",
        false,
        true
      );
      await loadingMessage.delete(); // Remove the loading message
      await message.channel.send({
        files: [{ attachment: filename, name: "polar_graph.png" }],
      });
    } catch (error) {
      console.error(error);
      await loadingMessage.edit(
        "❌ There was an error generating the polar graph."
      );
    }
  }
});

//?--------------------------------------------------------------------------------------
// Your existing code for the warn command goes here
client.on("messageCreate", async (message) => {
  // Ignore bot messages and ensure the command is issued in a text channel
  if (message.author.bot || !message.guild) return;

  // Check if the message starts with the prefix
  const PREFIX = "!";
  if (message.content.startsWith(PREFIX)) {
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "warn") {
      // Check if there are enough arguments
      if (args.length < 2) {
        return message.channel.send(
          "Please provide a user mention and the rule number for the warning."
        );
      }

      const userToWarn = message.mentions.users.first();

      // Check if the user to warn exists
      if (!userToWarn) {
        return message.channel.send(
          "User not found. Please mention a valid user."
        );
      }

      // The rule number and reason for the warning
      const ruleNumber = args[1]; // Assume the second argument is the rule number
      const reason = args.slice(2).join(" "); // The rest of the message is the reason

      // Get the channel name to refer to for rules
      const rulesChannelId = "1138487838363615317"; // Replace with your channel ID
      const rulesChannel = client.channels.cache.get(rulesChannelId);

      if (!rulesChannel) {
        return message.channel.send(
          "Rules channel not found. Please check the channel ID."
        );
      }

      // Create an embed message with black color (#000000)
      const warningEmbed = new EmbedBuilder()
        .setColor(0x000000) // Set the embed color to black (hex code for black)
        .setTitle("Warning Issued")
        .setDescription(
          `You were warned in **We Love Crack** for: ${reason}. This is against Rule ${ruleNumber}.`
        )
        .addFields({
          name: "Please Read",
          value: `Make sure to thoroughly read the rules in <#${rulesChannelId}>  so this won't happen again. Thank you.`,
        })
        .setFooter({ text: "This is an automated warning message." });

      // Send the warning message to the user in DM
      try {
        await userToWarn.send({ embeds: [warningEmbed] });
        message.channel.send(
          `Warning sent to ${userToWarn.tag} for Rule ${ruleNumber}: ${reason}.`
        );

        // Delete the original admin message
        await message.delete();
      } catch (error) {
        console.error(`Could not send DM to ${userToWarn.tag}.`, error);
        message.channel.send(
          `Unable to send a warning to ${userToWarn.tag}. They may have DMs disabled.`
        );
      }
    }
  }
});
// client.on("guildMemberAdd", async (member) => {
//   const welcomeChannel = client.channels.cache.get("1297952648783331389");
//   let canvas = welcomeCanvas;
//   canvas.context.font = "42px sans-serif";
//   canvas.context.textAlign == "center";
//   canvas.context.fillText(member.user.tag.toUpperCase(), 512, 410);
//   canvas.context.font = "32px sans-serif";
//   canvas.context.fillText(
//     `You are the ${member.guild.memberCount}th`,
//     512,
//     455
//   );
//   canvas.context.beginPath();
//   canvas.context.arc(512, 166, 119, 0, Math.PI * 2, true);
//   canvas.context.closePath();
//   canvas.context.clip();
//   await Canvas.loadImage(
//     member.user.displayAvatarURL({ extension: "png", size: 1024 })
//   ).then((img) => {
//     canvas.context.drawImage(img, 393, 47, 238, 238);
//   });
//   const atta = new Discord.AttachmentBuilder(canvas.create.toBuffer(), {
//     name: `welcome-${member.user.id}.png`,
//   });
//   try {
//     welcomeChannel.send(
//       `:wave: Hello ${member}, welcome to ${member.guild.name}!`,
//       atta
//     );
//   } catch (error) {
//     console.log(error);
//   }
// });

//invite

client.on("messageCreate", async (message) => {
  // Announcement command
  if (message.content.startsWith("!announce")) {
    if (
      message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      const announcement = message.content.split(" ").slice(1).join(" ");
      const announcementChannel = message.guild.channels.cache.find(
        (channel) => channel.name === "🚀︱announcements"
      );

      if (announcementChannel) {
        await announcementChannel.send(announcement);
        await message.delete(); // Delete the original message
      } else {
        message.channel.send("Announcement channel not found.");
      }
    } else {
      return message.channel.send("You don't have permission to announce!");
    }
  }

  // Announcement command
  if (message.content.startsWith("!general")) {
    if (
      message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      const generalchat = message.content.split(" ").slice(1).join(" ");
      const generalchannel = message.guild.channels.cache.find(
        (channel) => channel.name === "💬︱general-chat"
      );

      if (generalchannel) {
        await generalchannel.send(generalchat);
        await message.delete(); // Delete the original message
      } else {
        message.channel.send("Announcement channel not found.");
      }
    } else {
      return message.channel.send("You don't have permission to announce!");
    }
  }

  //Update channel
  if (message.content.startsWith("!update")) {
    if (
      message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      const update = message.content.split(" ").slice(1).join(" ");
      const updateChannel = message.guild.channels.cache.find(
        (channel) => channel.name === "🌎︱updates"
      );
      if (updateChannel) {
        await updateChannel.send(update);
        await message.delete();
      } else {
        message.channel.send("Update channel not found");
      }
    } else {
      return message.channel.send("You dont have permisison to send updates");
    }
  }

  //? Command to mute a user
  if (message.content.startsWith("!mute")) {
    // Check if the user has permission to manage roles
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)
    ) {
      return message.channel.send("You don't have permission to mute members.");
    }

    const userToMute = message.mentions.users.first();
    if (!userToMute) {
      return message.channel.send("Please mention a user to mute.");
    }

    const memberToMute = message.guild.members.cache.get(userToMute.id);
    if (!memberToMute) {
      return message.channel.send("That user isn't in this guild!");
    }

    // Get the Muted role
    const muteRole = message.guild.roles.cache.find(
      (role) => role.name === "Muted"
    ); // Change 'Muted' to your mute role name

    if (!muteRole) {
      return message.channel.send(
        "Mute role not found. Please create a 'Muted' role."
      );
    }

    // Add the Muted role to the user
    await memberToMute.roles
      .add(muteRole)
      .then(() => {
        message.channel.send(`Muted ${userToMute.tag}.`);
      })
      .catch((err) => {
        console.error("Failed to mute the member.", err);
        message.channel.send("I was unable to mute the member.");
      });
  }

  //! Command to unmute a user
  if (message.content.startsWith("!unmute")) {
    // Check if the user has permission to manage roles
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)
    ) {
      return message.channel.send(
        "You don't have permission to unmute members."
      );
    }

    const userToUnmute = message.mentions.users.first();
    if (!userToUnmute) {
      return message.channel.send("Please mention a user to unmute.");
    }

    const memberToUnmute = message.guild.members.cache.get(userToUnmute.id);
    if (!memberToUnmute) {
      return message.channel.send("That user isn't in this guild!");
    }

    // Get the Muted role
    const muteRole = message.guild.roles.cache.find(
      (role) => role.name === "Muted"
    ); // Change 'Muted' to your mute role name

    if (!muteRole) {
      return message.channel.send("Mute role not found.");
    }

    // Remove the Muted role from the user
    await memberToUnmute.roles
      .remove(muteRole)
      .then(() => {
        message.channel.send(`Unmuted ${userToUnmute.tag}.`);
      })
      .catch((err) => {
        console.error("Failed to unmute the member.", err);
        message.channel.send("I was unable to unmute the member.");
      });
  }

  let count = 0;

  // Command to display the member count

  if (message.content.startsWith("!membercount")) {
    const memberCount = message.guild.memberCount; // Get total member count
    message.channel.send(`Total members in this server: ${memberCount}`);
  }
});
const spamTrackers = new Map(); // Store spam data for each user
const events = require("events");

client.on("messageCreate", async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  const senderId = message.author.id;

  // Initialize spam tracker for the user if not already present
  if (!spamTrackers.has(senderId)) {
    spamTrackers.set(senderId, { count: 0, lastMessageTime: 0 });
  }

  const userSpamData = spamTrackers.get(senderId);
  const currentTime = Date.now();

  // Check the time difference between the last message and the current message
  if (currentTime - userSpamData.lastMessageTime < 3000) {
    // 0.8 seconds
    userSpamData.count += 1;
  } else {
    // Reset count if the user is not spamming (more than 0.8 seconds gap)
    userSpamData.count = 1; // Reset count to 1 for the new message
  }
  userSpamData.lastMessageTime = currentTime;

  // Update the last message time
  userSpamData.lastMessageTime = currentTime;

  // Check if the user has reached the spam limit
  if (userSpamData.count > 10) {
    // Send a warning message
    message.channel.send(
      `Warning: ${message.author.username}, you have been spamming messages! You will be timed out for 10 minutes.`
    );

    // Timeout the user for 10 minutes (600000 ms)
    const member = message.guild.members.cache.get(senderId);
    if (member) {
      try {
        await member.timeout(600000); // 10 minutes
        message.channel.send(
          `Timed out ${message.author.username} for 10 minutes.`
        );
      } catch (error) {
        console.error("Failed to timeout the member.", error);
      }
    }

    // Reset spam count after timeout
    userSpamData.count = 0;
  }
});
client.on("messageCreate", async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Detect keyword "resource" in message
  if (message.content.toLowerCase().includes("resource")) {
    const embed = new EmbedBuilder()
      .setColor("#000000") // Set the background color to black
      .setDescription(
        `Need study material? **Crack O/A Level has it all!** From engaging lectures to comprehensive notes to topical past papers. You can get them all and more.\n\n` + // Line gap
          `**Any catch?**\n\n` + // Line gap
          `Surprisingly, no. These websites require **no registering, are completely free and don't have advertisements**.\n\n` + // Line gap
          `**Visit now:**\n>>> [Crack A Level](https://crackalevel.wordpress.com/)\n[Crack O Level](https://crackolevel.wordpress.com/)`
      )
      .setFooter({ text: "For Students, By Students" });

    message.channel.send({ embeds: [embed] });
  }

  // Add other commands or functionalities below...
});
client.on("messageCreate", async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check for the !wipeRep command
  if (message.content.startsWith("!wiperep")) {
    // Check if the user has the necessary permissions
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send(
        "You don't have permission to reset reputation."
      );
    }

    // Get the mentioned user
    const userToReset = message.mentions.users.first();
    if (!userToReset) {
      return message.channel.send(
        "Please mention a user to reset their reputation."
      );
    }

    const userId = userToReset.id;

    // Reset the user's reputation to 0
    if (reputation[userId]) {
      reputation[userId] = 0;

      // Save updated reputation to file
      fs.writeFileSync(reputationFilePath, JSON.stringify(reputation, null, 2));

      message.channel.send(`Reputation for <@${userId}> has been reset to 0.`);
    } else {
      message.channel.send("This user doesn't have any reputation to reset.");
    }
  }

  // Add other commands and functionalities here
});

client.on("messageCreate", async (message) => {
  // Command to show help message in a specific channel
  if (
    message.content === "!help" &&
    message.channel.id === "1138487838837579813"
  ) {
    message.channel.send(`
>>> **Crack Bot Commands List:**

**1) Reputation**
Example: thank you @User, ty @User, and thank @User

**2) Warning**
Example: !warn @User

**3) Check Invite Count**
Example: !invites

**4) Announce (Staff Only in Announcement Channel)**
Example: !announce New features have been added to the server!

**5) Mute a Member**
Example: !mute @User

**6) Unmute a Member**
Example: !unmute @User

**7) Check Member Count**
Example: !membercount

**8) Resource Link Reply**
Type 'resource' to get a link from Crack Bot

**9) Reputation Leaderboard**
Example: !leaderboard

**10) Kick a Member**
Example: !kick @User

**11) Ban a Member**
Example: !ban @User

**12) Unban a Member**
Example: !unban @User

**13) Timeout a Member**
Example: !timeout @User 10 m
Use s, m, h, d, y for seconds, minutes, hours, days, years

**14) Remove Timeout**
Example: !removetimeout @User

**15) Show Help (Subject Chat Only)**
Type /help

**16) Booster List**
Example: !booster (Shows who boosted the server)

**17) Display Avatar**
Example: !avatar @User

**18) Server Update (Staff Only)**
Example: !update New update details here!
    `);
  }
});

client.on("guildMemberAdd", async (member) => {
  try {
    // Create the welcome embed
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x000000) // Set the color to black
      .setTitle(
        `Welcome ${member.user.username}  to We Love Crack's Discord Server 👋 We hope you enjoy your time here 🙂`
      ).setDescription(`
          Wish to access free study resources like engaging lectures, comprehensive notes, updated topical past papers, and more? Visit our websites now!
          
          [Crack A Level](https://crackalevel.wordpress.com/)
          [Crack O Level](https://crackolevel.wordpress.com/)
          `);

    // Send the DM
    await member.user.send({ embeds: [welcomeEmbed] });
    console.log(`Sent a welcome DM to ${member.user.tag}`);
  } catch (error) {
    console.error(`Could not send DM to ${member.user.tag}. Error:`, error);
  }
});

const channelId = "1304153017448136798"; // Replace with your channel ID for main roles
const roles = {
  "1304170359007871178": "Sovereign",
  "1304170245048504412": "Celestia",
  "1304170428608155771": "Phoenix",
  "1304170289307062424": "Queen",
  "1304170304083329124": "Vanguard",
  "1304170319279554650": "Aurora",
  "1304170402561396807": "Seraph",
};

// Command to send the main role selection message
client.on("messageCreate", async (message) => {
  if (
    message.content.toLowerCase() === "!send" &&
    message.member.permissions.has("ADMINISTRATOR")
  ) {
    const channel = message.guild.channels.cache.get(channelId);
    if (channel) {
      try {
        let messageContent =
          "**Choose your role by reacting with an emoji:**\n";
        for (const [emojiId, roleName] of Object.entries(roles)) {
          messageContent += `<:${roleName}:${emojiId}> - ${roleName}\n`;
        }

        const sentMessage = await channel.send(messageContent);

        for (const emojiId of Object.keys(roles)) {
          await sentMessage.react(emojiId); // React using the emoji ID
        }
      } catch (error) {
        console.error("Error sending message or adding reactions:", error);
      }
    }
  }
});

//** Snipe Feature By Muzammil
const snipedMessages = new Map();

client.on("messageDelete", (message) => {
  if (!message.author || !message.content) return; // Ignore system messages or empty content
  const channelSnipes = snipedMessages.get(message.channel.id) || [];
  channelSnipes.unshift({
    content: message.content,
    author: message.author,
    time: message.createdAt,
  });
  if (channelSnipes.length > 10) channelSnipes.pop(); // Keep only the last 10 deleted messages per channel
  snipedMessages.set(message.channel.id, channelSnipes);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === "snipe") {
    const mentionedUser = options.getUser("user");
    const channelSnipes = snipedMessages.get(interaction.channel.id);

    if (!channelSnipes || channelSnipes.length === 0) {
      return interaction.reply("There's nothing to snipe!");
    }

    let sniped;
    if (mentionedUser) {
      // Find the latest deleted message from the mentioned user
      sniped = channelSnipes.find((s) => s.author.id === mentionedUser.id);
      if (!sniped) {
        return interaction.reply(
          `No recently deleted messages found for ${mentionedUser.tag}.`
        );
      }
    } else {
      // Default to the most recent deleted message
      sniped = channelSnipes[0];
    }

    const embed = new EmbedBuilder()
      .setColor(0xff5555)
      .setAuthor({
        name: sniped.author.tag,
        iconURL: sniped.author.displayAvatarURL(),
      })
      .setDescription(sniped.content)
      .setFooter({ text: `Deleted at ${sniped.time.toLocaleString()}` });

    await interaction.reply({ embeds: [embed] });
  }
});

// Register slash commands
client.on("ready", async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName("snipe")
      .setDescription("View the last deleted message.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("Mention a user to snipe their last deleted message")
          .setRequired(false)
      ),
  ];

  // Register commands globally (it might take some time to propagate)
  client.application.commands.set(commands);
  console.log("Slash commands registered!");
});

//--------------------------------
// Handle reactions to assign/remove main roles
client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.message.channel.id === channelId && !user.bot) {
    const roleName = roles[reaction.emoji.id]; // Match by emoji ID
    const role = reaction.message.guild.roles.cache.find(
      (r) => r.name === roleName
    );
    const member = await reaction.message.guild.members.fetch(user.id);

    if (role && member) {
      try {
        await member.roles.add(role);
        await user.send(`You have been given the **${roleName}** role!`);
      } catch (error) {
        console.error(
          `Error assigning role ${roleName} to user ${user.tag}:`,
          error
        );
      }
    }
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.message.channel.id === channelId && !user.bot) {
    const roleName = roles[reaction.emoji.id]; // Match by emoji ID
    const role = reaction.message.guild.roles.cache.find(
      (r) => r.name === roleName
    );
    const member = await reaction.message.guild.members.fetch(user.id);

    if (role && member) {
      try {
        await member.roles.remove(role);
        await user.send(`The **${roleName}** role has been removed from you.`);
      } catch (error) {
        console.error(
          `Error removing role ${roleName} from user ${user.tag}:`,
          error
        );
      }
    }
  }
});

const colorChannelId = "1304153017448136798"; // Replace with the channel ID for color roles
const colorRoles = {
  "🔴": "Red",
  "🔵": "Blue",
  "🟢": "Green",
  "🟡": "Yellow",
  "🟠": "Orange",
  "🟣": "Purple",
};

// Command to send the color role selection message
client.on("messageCreate", async (message) => {
  if (
    message.content.toLowerCase() === "!sendcolor" &&
    message.member.permissions.has("ADMINISTRATOR")
  ) {
    const channel = message.guild.channels.cache.get(colorChannelId);
    if (channel) {
      try {
        let messageContent =
          "**Choose your color role by reacting with an emoji:**\n";
        for (const [emoji, colorName] of Object.entries(colorRoles)) {
          messageContent += `${emoji} - ${colorName}\n`;
        }

        const sentMessage = await channel.send(messageContent);

        for (const emoji of Object.keys(colorRoles)) {
          await sentMessage.react(emoji);
        }
      } catch (error) {
        console.error(
          "Error sending color role message or adding reactions:",
          error
        );
      }
    }
  }
});

//! rotate pictures by Muzzammil
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Command to rotate the image
  if (message.content.startsWith("!rotate")) {
    // Get the angle from the command (default to 90 if no angle is specified)
    const args = message.content.split(" ");
    let angle = args[1] ? parseInt(args[1]) : 90; // Default to 90 if no angle is provided

    // Validate angle
    const validAngles = [90, 180, 270, 360];
    if (!validAngles.includes(angle)) {
      return message.reply(
        "❌ Please provide a valid rotation angle: **90**, **180**, **270**, or **360**."
      );
    }

    let imageUrl = null;

    // If the message is a reply to an image, use that image
    if (message.reference && message.reference.messageId) {
      const repliedMessage = await message.channel.messages.fetch(
        message.reference.messageId
      );
      if (repliedMessage.attachments.size > 0) {
        imageUrl = repliedMessage.attachments.first().url;
      }
    }

    // If no replied message with an image, check for an image in the current message
    if (!imageUrl && message.attachments.size > 0) {
      imageUrl = message.attachments.first().url;
    }

    // If there's no image, ask the user to attach an image
    if (!imageUrl) {
      return message.reply(
        "❌ Please attach an image or reply to an image message."
      );
    }

    // File paths
    const inputPath = "./input.png";
    const outputPath = "./rotated.png";

    // Download the image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(buffer));

    try {
      // Rotate the image by the specified angle
      await sharp(inputPath).rotate(angle).toFile(outputPath);

      // Send the rotated image back
      await message.reply({
        content: `Here's your image rotated by **${angle}°**:`,
        files: [outputPath],
      });

      // Clean up the files after a short delay
      setTimeout(() => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
        console.log("Cleaned up temporary files.");
      }, 5000);
    } catch (error) {
      console.error(error);
      message.reply("❌ Something went wrong while rotating the image.");
    }
  }
});
// Handle reactions to assign/remove color roles
client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.message.channel.id === colorChannelId && !user.bot) {
    const colorRoleName = colorRoles[reaction.emoji.name];
    const colorRole = reaction.message.guild.roles.cache.find(
      (r) => r.name === colorRoleName
    );
    const member = await reaction.message.guild.members.fetch(user.id);

    if (colorRole && member) {
      try {
        await member.roles.add(colorRole);
        await user.send(
          `You have been given the **${colorRoleName}** color role!`
        );
      } catch (error) {
        console.error(
          `Error assigning color role ${colorRoleName} to user ${user.tag}:`,
          error
        );
      }
    }
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.message.channel.id === colorChannelId && !user.bot) {
    const colorRoleName = colorRoles[reaction.emoji.name];
    const colorRole = reaction.message.guild.roles.cache.find(
      (r) => r.name === colorRoleName
    );
    const member = await reaction.message.guild.members.fetch(user.id);

    if (colorRole && member) {
      try {
        await member.roles.remove(colorRole);
        await user.send(
          `The **${colorRoleName}** color role has been removed from you.`
        );
      } catch (error) {
        console.error(
          `Error removing color role ${colorRoleName} from user ${user.tag}:`,
          error
        );
      }
    }
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Set the bot's activity to just show "Watching We Love Crack"
  client.user.setActivity(".gg/welovecrack", { type: ActivityType.Watching });
});

// Path to reputation file
const reputationFilePath = path.join(__dirname, "reputation.json");

// Load reputation data
let reputation = {};
if (fs.existsSync(reputationFilePath)) {
  reputation = JSON.parse(fs.readFileSync(reputationFilePath));
}

// Function to display the leaderboard
async function getLeaderboard(guild, reputationData) {
  const leaderboard = [];

  for (const [userId, points] of Object.entries(reputationData)) {
    try {
      // Fetch the user and get their username
      const member = await guild.members.fetch(userId).catch(() => null);
      const username = member ? member.user.username : "Unknown User";

      leaderboard.push(`${username}: ${points} points`);
    } catch (err) {
      console.error(`Failed to fetch user ${userId}:`, err);
      leaderboard.push(`Unknown User: ${points} points`);
    }
  }

  // Sort leaderboard by points (highest first)
  leaderboard.sort((a, b) => {
    const aPoints = parseInt(a.split(":")[1].trim(), 10);
    const bPoints = parseInt(b.split(":")[1].trim(), 10);
    return bPoints - aPoints;
  });

  return leaderboard;
}

// Assign roles based on milestones
async function assignRole(member, guild, roleId, roleName, milestone) {
  const role = guild.roles.cache.get(roleId);
  if (role) {
    await member.roles.add(role).catch(console.error);
    return `🎉 Congratulations <@${member.id}>! You've reached ${milestone} reputation points and earned the **${roleName}** role! 🏅`;
  }
  return null;
}

// Main event handler
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Thank you detection
  const thankYouResponses = [
    "thank you",
    "thanks",
    "ty",
    "tysm",
    "thank",
    "jazakallah",
    "tyy",
    "jazak allah",
    "tyyy",
    "thankssss",
    "tyyyyy",
    "thankssssss",
    "tyyyms",
    "thank youuu",
    "thaaaaank",
    "thnk you",
    "thanksssss",
    "tyyyyyyyyy",
    "thx",
    "thanks a lot",
    "thanks so much",
    "many thanks",
    "tyvm",
    "thank youuuuuu",
    "thnks",
    "thanks everyone",
    "tyyyyyyyyyyyyyyyyyyyyyyy",
    "thaaaaaaaaank you",
    "thaankkksss",
    "thx a lot",
    "thankkssssss",
    "tysmmb",
    "tytyty",
    "tanks",
    "thankz",
    "thxsssss",
    "tyyyms",
    "thxsm",
    "tyyyyyyys",
    "thxuuuu",
    "manyyyy thanks",
    "tqy",
    "tyyyms",
    "thanyouuu",
    "thankyouuuuu",
    "tyyyyyyy",
    "thxthx",
    "thnkyou",
    "tyyyys",
    "tbhanks",
    "tyyysssss",
    "tqsm",
    "thankzsm",
    "tysmx",
    "tysmsoomuch",
    "tnx",
    "thankzzzz",
    "ty4u",
    "thankyoouu",
    "thxthank",
    "tks",
    "thnxx",
    "thanxss",
    "tytytyty",
    "tksm",
    "thxsmmm",
    "tyyyy",
    "tyyyyyy",
    "thankss",
    "thanksss",
    "thankssss",
    "thanksssssss",
    "tysmm",
    "tysmmm",
    "tysmmmm",
    "tysmmmmm",
    "thaankss",
  ];
  const messageContent = message.content.toLowerCase();
  const regex = new RegExp(`\\b(${thankYouResponses.join("|")})\\b`, "i");

  if (regex.test(messageContent)) {
    const senderId = message.author.id;
    const mentionedUser = message.mentions.users.first();

    if (mentionedUser && mentionedUser.id !== senderId) {
      const userId = mentionedUser.id;
      reputation[userId] = (reputation[userId] || 0) + 1;

      // Save updated reputation to file
      fs.writeFileSync(reputationFilePath, JSON.stringify(reputation, null, 2));

      message.channel.send(
        `Gave +1 reputation to <@${userId}> (${reputation[userId]} points)!`
      );

      const member = await message.guild.members
        .fetch(userId)
        .catch(console.error);

      // Assign roles based on milestones

      if (reputation[userId] === 50) {
        const roleMessage = await assignRole(
          member,
          message.guild,
          "1298570133597585428",
          "Rising Star",
          50
        );
        if (roleMessage) message.channel.send(roleMessage);
      } else if (reputation[userId] === 100) {
        const roleMessage = await assignRole(
          member,
          message.guild,
          "1298570203067715615",
          "Mastermind",
          100
        );
        if (roleMessage) message.channel.send(roleMessage);
      } else if (reputation[userId] === 500) {
        const roleMessage = await assignRole(
          member,
          message.guild,
          "1298570793684303893",
          "Legendary Luminary",
          500
        );
        if (roleMessage) message.channel.send(roleMessage);
      } else if (reputation[userId] === 10) {
        const roleMessage = await assignRole(
          member,
          message.guild,
          "1307430793194508381",
          "Trailblazer",
          10
        );
        if (roleMessage) message.channel.send(roleMessage);
      }
    } else if (mentionedUser && mentionedUser.id === senderId) {
      message.channel.send("You can't thank/bless yourself!");
    } else {
      message.channel.send("Please mention a user to thank/bless!");
    }
  }

  // Leaderboard command
  if (message.content.toLowerCase() === "!leaderboard") {
    try {
      const leaderboard = await getLeaderboard(message.guild, reputation); // Fetch leaderboard data
      const pageSize = 10; // Number of entries per page
      const totalPages = Math.ceil(leaderboard.length / pageSize);
      let currentPage = 0;

      const generateEmbed = (page) => {
        const start = page * pageSize;
        const end = start + pageSize;
        const currentRanks = leaderboard.slice(start, end);

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(
            `Reputation Leaderboard - Page ${page + 1} of ${totalPages}`
          )
          .setDescription(currentRanks.join("\n"))
          .setFooter({ text: "Use ▶ and ◀ to navigate pages." });

        return embed;
      };

      const embedMessage = await message.channel.send({
        embeds: [generateEmbed(currentPage)],
      });

      // Add reactions for navigation
      if (totalPages > 1) {
        await embedMessage.react("◀");
        await embedMessage.react("▶");

        const filter = (reaction, user) =>
          ["◀", "▶"].includes(reaction.emoji.name) &&
          user.id !== embedMessage.author.id;

        const collector = embedMessage.createReactionCollector({
          filter,
          time: 60000,
        });

        collector.on("collect", async (reaction, user) => {
          try {
            if (reaction.emoji.name === "▶") {
              if (currentPage < totalPages - 1) {
                currentPage++;
                await embedMessage.edit({
                  embeds: [generateEmbed(currentPage)],
                });
              }
            } else if (reaction.emoji.name === "◀") {
              if (currentPage > 0) {
                currentPage--;
                await embedMessage.edit({
                  embeds: [generateEmbed(currentPage)],
                });
              }
            }

            await reaction.users.remove(user.id); // Remove user's reaction
          } catch (err) {
            console.error("Error handling reaction:", err);
            await message.channel.send(
              "⚠️ An error occurred while processing your reaction."
            );
          }
        });

        collector.on("end", () => {
          embedMessage.reactions.removeAll().catch(console.error); // Clean up reactions
        });
      }
    } catch (err) {
      console.error("Error in leaderboard command:", err);
      await message.channel.send(
        "⚠️ An error occurred while generating the leaderboard. Please try again later."
      );
    }
  }
});
client.setMaxListeners(40);

// Event listener for messages
client.on("messageCreate", async (message) => {
  // Check if the message starts with "!kick" and was not sent by a bot
  if (message.content.startsWith("!kick") && !message.author.bot) {
    try {
      // Check if the user has permission to kick members
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.KickMembers)
      ) {
        return message.channel.send(
          "You don't have permission to kick members."
        );
      }

      // Get the mentioned user to kick
      const userToKick = message.mentions.users.first();
      if (!userToKick) {
        return message.channel.send("Please mention a user to kick.");
      }

      // Get the member object from the guild
      const memberToKick = message.guild.members.cache.get(userToKick.id);
      if (!memberToKick) {
        return message.channel.send("That user isn't in this guild!");
      }

      // Kick the member
      await memberToKick.kick();
      message.channel.send(`Kicked ${userToKick.tag}.`);
    } catch (err) {
      console.error("An error occurred while executing the kick command:", err);
      message.channel.send(
        "An error occurred while trying to kick the member. Please try again later."
      );
    }
  }
});
// Event listener for messages
client.on("messageCreate", async (message) => {
  // Command to ban a user
  if (message.content.startsWith("!ban")) {
    try {
      // Check if the user has permission to ban members
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.BanMembers)
      ) {
        return message.channel.send(
          "You don't have permission to ban members."
        );
      }

      // Get the mentioned user to ban
      const userToBan = message.mentions.users.first();
      if (!userToBan) {
        return message.channel.send("Please mention a user to ban.");
      }

      // Get the member from the guild
      const memberToBan = message.guild.members.cache.get(userToBan.id);
      if (!memberToBan) {
        return message.channel.send("That user isn't in this guild!");
      }

      // Ban the member
      await memberToBan.ban();
      message.channel.send(`Banned ${userToBan.tag}.`);
    } catch (err) {
      console.error("Failed to ban the member:", err);
      message.channel.send("An error occurred while trying to ban the member.");
    }
  }

  // Command to unban a user
  if (message.content.startsWith("!unban")) {
    try {
      // Check if the user has permission to unban members
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.BanMembers)
      ) {
        return message.channel.send(
          "You don't have permission to unban members."
        );
      }

      // Extract the user ID from the command
      const userIdToUnban = message.content.split(" ")[1];
      if (!userIdToUnban) {
        return message.channel.send(
          "Please provide the ID of the user to unban."
        );
      }

      // Unban the user
      await message.guild.members.unban(userIdToUnban);
      message.channel.send(`Unbanned user with ID: ${userIdToUnban}.`);
    } catch (err) {
      console.error("Failed to unban the member:", err);
      message.channel.send(
        "An error occurred while trying to unban the member."
      );
    }
  }
});

// Global error handler to log any unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

const allowedRole = "Server Manager"; // Replace with the actual role name or ID

client.on("messageCreate", async (message) => {
  try {
    // Check if the message is from a guild (server)
    if (!message.guild) {
      return; // Ignore DMs or non-guild messages
    }

    // Check if the member has the required role to use the timeout commands
    const hasRole = message.member.roles.cache.some(
      (role) => role.name === allowedRole
    );

    // Command to timeout (mute) a user
    if (message.content.startsWith("!timeout")) {
      if (!hasRole) {
        return message.channel.send(
          "You don't have permission to use this command."
        );
      }

      const args = message.content.split(" ");

      // Check if we have enough arguments (e.g., !timeout @User 10 m)
      if (args.length < 4) {
        return message.channel.send(
          "Invalid duration format. Use [number] [unit] (e.g., 10 s, 1 h, 2 d, 1 y)."
        );
      }

      const mentionedUser = message.mentions.users.first();
      const durationValue = parseInt(args[2]);
      const durationUnit = args[3];

      if (!mentionedUser) {
        return message.channel.send("Please mention a user to timeout.");
      }

      if (isNaN(durationValue) || durationValue <= 0) {
        return message.channel.send("Please provide a valid duration number.");
      }

      let timeoutDuration;
      switch (durationUnit) {
        case "s": // seconds
          timeoutDuration = durationValue * 1000;
          break;
        case "m": // minutes
          timeoutDuration = durationValue * 1000 * 60;
          break;
        case "h": // hours
          timeoutDuration = durationValue * 1000 * 60 * 60;
          break;
        case "d": // days
          timeoutDuration = durationValue * 1000 * 60 * 60 * 24;
          break;
        case "y": // years
          timeoutDuration = durationValue * 1000 * 60 * 60 * 24 * 365;
          break;
        default:
          return message.channel.send(
            "Invalid time unit. Use s, m, h, d, or y."
          );
      }

      try {
        await message.guild.members.cache
          .get(mentionedUser.id)
          .timeout(timeoutDuration);
        message.channel.send(
          `Timed out <@${mentionedUser.id}> for ${durationValue} ${durationUnit}.`
        );
      } catch (error) {
        console.error(error);
        message.channel.send("Failed to timeout the user.");
      }
    }

    // Command to remove timeout from a user
    if (message.content.startsWith("!removetimeout")) {
      if (!hasRole) {
        return message.channel.send(
          "You don't have permission to use this command."
        );
      }

      const userToRemoveTimeout = message.mentions.users.first();
      if (!userToRemoveTimeout) {
        return message.channel.send("Please mention a user to remove timeout.");
      }

      const memberToRemoveTimeout = message.guild.members.cache.get(
        userToRemoveTimeout.id
      );
      if (!memberToRemoveTimeout) {
        return message.channel.send("That user isn't in this guild!");
      }

      await memberToRemoveTimeout
        .timeout(null)
        .then(() => {
          message.channel.send(
            `Removed timeout from ${userToRemoveTimeout.tag}.`
          );
        })
        .catch((err) => {
          console.error("Failed to remove timeout from the member.", err);
          message.channel.send(
            "I was unable to remove timeout from the member."
          );
        });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    // Optional: Log the error to a specific channel or log file
  }
});
const TOKEN = "YOUR TOKEN ID HERE";
const CLIENT_ID = "YOUR CLIENT ID HERE";
const GUILD_ID = "1138487837608648745";

const commands = [
  {
    name: "help",
    description: "Request help from a channel helper",
  },
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Started registering application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log("Successfully registered application (/) commands.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
})();

const channelHelpers = {
  "1138487839315742774": "1138487837642195057",
  "1138487839315742777": "1138487837654786150",
  "1138487839810650216": "1138487837642195061",
  "1138487839315742778": "1138487837642195063",
  "1138487839810650214": "1138487837642195059",
  "1138487839315742779": "1138487837654786153",
  "1138487839315742773": "1138487837654786151",
  "1138487839315742772": "1138487837621243987",
  "1138487839315742775": "1138487837621243991",
  "1138487839315742776": "1138487837621243993",
  "1138487839810650213": "1138487837642195055",
  "1138487839810650215": "1138487837621243989",
  "1138487839810650217": "1138487837621243995",
};

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "help") {
    try {
      const helperRoleId = channelHelpers[interaction.channel.id];
      if (!helperRoleId)
        return interaction.reply(
          `This command is not available in this channel.`
        );

      const helperRole = interaction.guild.roles.cache.get(helperRoleId);
      if (!helperRole)
        return interaction.reply(`No helper role is set for this channel.`);

      await interaction.reply(
        `Help request noted! A helper will be notified in 10 minutes...`
      );

      let timeLeft = 10;
      const countdownInterval = setInterval(async () => {
        timeLeft--;
        if (timeLeft > 0) {
          try {
            await interaction.editReply(
              `Help request noted! A helper will be notified in ${timeLeft} minutes.`
            );
          } catch (error) {
            console.error("Failed to update countdown message:", error);
          }
        } else {
          clearInterval(countdownInterval);
          try {
            await interaction.followUp(
              `${helperRole}, ${interaction.user} needs help!`
            );
          } catch (error) {
            console.error("Failed to send helper notification:", error);
          }
        }
      }, 60000);
    } catch (error) {
      console.error(
        "An error occurred while processing the /help command:",
        error
      );
      interaction.reply(`Something went wrong. Please try again later.`);
    }
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

client.on("messageCreate", async (message) => {
  if (message.content === "!booster") {
    try {
      // Ensure the message is from a guild
      if (!message.guild) return;

      // Fetch updated guild member data
      await message.guild.members.fetch();

      // Filter members who boosted the server
      const boosters = message.guild.members.cache.filter(
        (member) => member.premiumSince
      );

      if (boosters.size === 0) {
        return message.channel.send("No one has boosted this server yet.");
      }

      // Construct the reply message
      let reply = `**Boosters of ${message.guild.name}:**\n`;
      boosters.forEach((member) => {
        reply += `- ${
          member.user.tag
        } (Boosted since: ${member.premiumSince.toDateString()})\n`;
      });

      // Add total boost count
      reply += `\n**Total Boosts:** ${
        message.guild.premiumSubscriptionCount || 0
      }`;
      message.channel.send(reply);
    } catch (error) {
      console.error("An error occurred while fetching boosters:", error);
      message.channel.send(
        "An error occurred while processing your request. Please try again later."
      );
    }
  }
});

process.on("uncaughtException", (error) => {
  console.error("Unhandled Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

client.on("messageCreate", (message) => {
  try {
    // Ignore bot messages and messages without the "!avatar" command
    if (message.author.bot) return;

    // Check if the message starts with "!avatar"
    if (message.content.toLowerCase().startsWith("!avatar")) {
      // Get the mentioned user or default to the message author
      const user = message.mentions.users.first() || message.author;

      // Get the user's avatar URL
      const avatarUrl = user.displayAvatarURL({
        dynamic: true, // For GIFs
        size: 1024, // High-resolution
      });

      // Reply with "avatar" as a clickable link
      message.reply(
        `Here is ${user.username}'s avatar: [avatar](${avatarUrl})`
      );
    }
  } catch (error) {
    console.error(
      "An error occurred while processing the !avatar command:",
      error
    );
    message.reply(
      "Oops! Something went wrong while fetching the avatar. Please try again later."
    );
  }
});
client.on("messageCreate", async (message) => {
  if (message.content === "!invites") {
    try {
      const invites = await message.guild?.invites.fetch({ cache: true });
      const inviteCounter = {};

      if (invites) {
        invites.forEach((invite) => {
          const uses = invite.uses;
          const inviter = invite.inviter;

          if (uses > 0 && inviter && !inviter.bot) {
            const name = `${inviter.username}#${inviter.discriminator}`;
            inviteCounter[name] = (inviteCounter[name] || 0) + uses;
          }
        });
      }

      const sortedInvites = Object.keys(inviteCounter).sort(
        (a, b) => inviteCounter[b] - inviteCounter[a]
      );

      // Prepare pagination data
      const itemsPerPage = 10;
      const totalPages = Math.ceil(sortedInvites.length / itemsPerPage);
      let currentPage = 0;

      const generateEmbed = (page) => {
        const embed = new EmbedBuilder()
          .setTitle("Invites Leaderboard")
          .setColor("#3498db")
          .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageInvites = sortedInvites.slice(start, end);

        let description = "";
        pageInvites.forEach((invite) => {
          const count = inviteCounter[invite];
          description += `\n${invite} - ${count} invites`;
        });

        embed.setDescription(description || "No invites found.");
        return embed;
      };

      // Send initial embed
      const embedMessage = await message.reply({
        embeds: [generateEmbed(currentPage)],
      });

      if (totalPages > 1) {
        await embedMessage.react("◀️");
        await embedMessage.react("▶️");

        const filter = (reaction, user) =>
          ["◀️", "▶️"].includes(reaction.emoji.name) &&
          user.id === message.author.id;

        const collector = embedMessage.createReactionCollector({
          filter,
          time: 60000,
        });

        collector.on("collect", (reaction) => {
          if (reaction.emoji.name === "▶️") {
            currentPage = (currentPage + 1) % totalPages;
          } else if (reaction.emoji.name === "◀️") {
            currentPage = (currentPage - 1 + totalPages) % totalPages;
          }

          embedMessage.edit({ embeds: [generateEmbed(currentPage)] });
          reaction.users.remove(message.author).catch(console.error);
        });

        collector.on("end", () => {
          embedMessage.reactions.removeAll().catch(console.error);
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      message.reply(
        "An error occurred while fetching invites. Please try again later."
      );
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!age")) {
    let user = message.mentions.users.first() || message.author; // Mentioned user or message author

    // Calculate account age
    const accountCreationDate = user.createdAt;
    const now = new Date();
    const ageInMs = now - accountCreationDate;

    // Convert to years, months, and days
    const years = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(
      (ageInMs % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
    );
    const days = Math.floor(
      (ageInMs % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)
    );

    // Send the response
    message.channel.send(
      `🕒 **${user.username}'s** account age: ${years} years, ${months} months, and ${days} days.`
    );
  }
});

// Event listener for incoming messages
client.on("messageCreate", (message) => {
  try {
    // Array of possible salam greetings
    const greetings = [
      "salam u 3alaik",
      "salam",
      "سلام علیکم",
      "Assalamualikum",
      "سلام الله عليكم",
      "asalamulikum",
      "Assalamu Alaikum wa Rahmatullahi wa Barakatuh",
      "asalamu alaik",
      "Assalam o Alaikum",
      "Assalamualaikum",
      "aoa",
      "AOA",
      "سلام",
    ];

    // Check if the message content matches any of the greetings
    if (greetings.includes(message.content.toLowerCase())) {
      message.reply("وعليكم السلام ورحمة الله وبركاته");
    }
  } catch (error) {
    console.error("Error occurred while processing message:", error);
  }
});

// Global error handler for unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:", error);
});

// Prefix for Commands
const PREFIX = "!";

client.on("messageCreate", async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check if the message starts with the prefix
  if (!message.content.startsWith(PREFIX)) return;

  // Extract the command and arguments
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Command: !delete
  if (command === "delete") {
    // Check if the user has the required permission
    if (!message.member.permissions.has("ManageMessages")) {
      return message.reply("You do not have permission to use this command.");
    }

    // Check if the user provided a valid number of messages to delete
    const count = parseInt(args[0], 10);

    if (!count || count < 1 || count > 100) {
      return message.reply(
        "Please provide a number between 1 and 100 for the number of messages to delete."
      );
    }

    // Attempt to bulk delete messages
    try {
      const deletedMessages = await message.channel.bulkDelete(count, true); // Deletes only messages less than 14 days old
      message.channel
        .send(`Successfully deleted ${deletedMessages.size} message(s).`)
        .then((msg) => setTimeout(() => msg.delete(), 5000)) // Auto-delete success message after 5 seconds
        .catch(console.error);
    } catch (error) {
      console.error("Error deleting messages:", error); // Log error for debugging
      message.channel.send(
        "There was an error trying to delete messages. Please ensure I have the necessary permissions."
      );
    }
  }
});
// Log in to Discord with your app's token
client.login(TOKEN);
