const { Client, GatewayIntentBits, GuildMember } = require("discord.js");
const fs = require("fs");
const { type } = require("os");
const path = require("path");
const Canvas = require("canvas");
const { log } = require("console");
const Discord = require("discord.js");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const canvafy = require("canvafy");

var welcomeCanvas = {};
welcomeCanvas.create = Canvas.createCanvas(1024, 500);

welcomeCanvas.context = welcomeCanvas.create.getContext("2d");
welcomeCanvas.context.font = "72px sans-serif";
welcomeCanvas.context.fillStyle == "#ffffff";

Canvas.loadImage("./img/img.png").then(async (img) => {
  welcomeCanvas.context.drawImage(img, 0, 0, 1024, 500);
  welcomeCanvas.context.fillText("Welcome", 360, 360);
  welcomeCanvas.context.beginPath();
  welcomeCanvas.context.arc(512, 166, 128, 0, Math.PI * 2, true);
  welcomeCanvas.context.stroke();
  welcomeCanvas.context.fill();
});

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
  ],
});

//welcome
client.on("guildMemberAdd", async (member) => {
  const welcome = await new canvafy.WelcomeLeave()
    .setAvatar(
      member.user.displayAvatarURL({ forceStatic: true, extension: "png" })
    )
    .setBackground("image", "./img/img.png")
    .setTitle(`Welcome!`)
    .setDescription(
      `Hi ${member.user.username} we hope you will have a great time here!`,
      "#FFFFFF"
    )
    .setBorder("#2a2e35")
    .setAvatarBorder("#FFFFFF")
    .setOverlayOpacity(0.1)
    .build();

  member.guild.channels.cache.get("1303221399573364807").send({
    content: `${member} has joined the server!`,
    files: [
      {
        attachment: welcome,
        name: `welcome-${member.id}.png`,
      },
    ],
  });
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
  if (message.content === "!invites") {
    const invites = await message.guild?.invites.fetch({
      cache: true,
    });

    const inviteCounter = {};

    if (invites) {
      invites.forEach((invite) => {
        const uses = invite.uses;
        const inviter = invite.inviter;
        const { username, discriminator } = inviter;

        if (uses === 0 || inviter.bot) {
          return;
        }

        const name = `${username}#${discriminator}`;
        inviteCounter[name] = (inviteCounter[name] || 0) + uses;
      });
    }

    let replyText = `Invites:`;

    const sortedInvites = Object.keys(inviteCounter).sort(
      (a, b) => inviteCounter[b] - inviteCounter[a]
    );

    for (const invite of sortedInvites) {
      const count = inviteCounter[invite];
      replyText += `\n${invite} - ${count}`;
    }

    message.reply(replyText);
  }
}); // When the bot is ready
client.once("ready", () => {
  console.log("Bot is online!");
});

//*  Listen for messages
// / Path to the reputation file
const reputationFilePath = path.join(__dirname, "reputation.json");

// Load reputation data
let reputation = {};
if (fs.existsSync(reputationFilePath)) {
  reputation = JSON.parse(fs.readFileSync(reputationFilePath));
}

client.on("messageCreate", async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Reputation command for thanking helpers
  const thankYouResponses = ["thank you", "thanks", "ty", "tysm", "thank"];
  const messageContent = message.content.toLowerCase();

  // Check if any thank-you phrase is in the message
  if (thankYouResponses.some((response) => messageContent.includes(response))) {
    const senderId = message.author.id;
    const mentionedUser = message.mentions.users.first();

    // If a user is mentioned and it's not the sender
    if (mentionedUser && mentionedUser.id !== senderId) {
      const userId = mentionedUser.id;

      // Increment reputation for the mentioned user
      reputation[userId] = (reputation[userId] || 0) + 1;

      // Save updated reputation to file
      fs.writeFileSync(reputationFilePath, JSON.stringify(reputation));

      message.channel.send(
        `Gave +1 reputation to <@${userId}> (${reputation[userId]})!`
      );
    } else if (mentionedUser && mentionedUser.id === senderId) {
      message.channel.send("You can't thank yourself!");
    } else {
      message.channel.send("Please mention a user to thank!");
    }
  }

  // Announcement command
  if (message.content.startsWith("!announce")) {
    if (message.member.permissions.has("ManageMessages")) {
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
    if (message.member.permissions.has("ManageMessages")) {
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
    if (message.member.permissions.has("ManageMessages")) {
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
    if (!message.member.permissions.has("MANAGE_ROLES")) {
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
    if (!message.member.permissions.has("MANAGE_ROLES")) {
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

  // Command to kick a user
  if (message.content.startsWith("!kick")) {
    if (!message.member.permissions.has("KICK_MEMBERS")) {
      return message.channel.send("You don't have permission to kick members.");
    }

    const userToKick = message.mentions.users.first();
    if (!userToKick) {
      return message.channel.send("Please mention a user to kick.");
    }

    const memberToKick = message.guild.members.cache.get(userToKick.id);
    if (!memberToKick) {
      return message.channel.send("That user isn't in this guild!");
    }

    await memberToKick
      .kick()
      .then(() => {
        message.channel.send(`Kicked ${userToKick.tag}.`);
      })
      .catch((err) => {
        console.error("Failed to kick the member.", err);
        message.channel.send("I was unable to kick the member.");
      });
  }

  // Command to ban a user
  if (message.content.startsWith("!ban")) {
    if (!message.member.permissions.has("BAN_MEMBERS")) {
      return message.channel.send("You don't have permission to ban members.");
    }

    const userToBan = message.mentions.users.first();
    if (!userToBan) {
      return message.channel.send("Please mention a user to ban.");
    }

    const memberToBan = message.guild.members.cache.get(userToBan.id);
    if (!memberToBan) {
      return message.channel.send("That user isn't in this guild!");
    }

    await memberToBan
      .ban()
      .then(() => {
        message.channel.send(`Banned ${userToBan.tag}.`);
      })
      .catch((err) => {
        console.error("Failed to ban the member.", err);
        message.channel.send("I was unable to ban the member.");
      });
  }

  // Command to unban a user
  if (message.content.startsWith("!unban")) {
    if (!message.member.permissions.has("BAN_MEMBERS")) {
      return message.channel.send(
        "You don't have permission to unban members."
      );
    }

    const userIdToUnban = message.content.split(" ")[1];
    if (!userIdToUnban) {
      return message.channel.send(
        "Please provide the ID of the user to unban."
      );
    }

    await message.guild.members
      .unban(userIdToUnban)
      .then(() => {
        message.channel.send(`Unbanned user with ID: ${userIdToUnban}.`);
      })
      .catch((err) => {
        console.error("Failed to unban the member.", err);
        message.channel.send("I was unable to unban the member.");
      });
  }

  // Command to remove timeout from a user
  if (message.content.startsWith("!removetimeout")) {
    if (!message.member.permissions.has("MODERATE_MEMBERS")) {
      return message.channel.send(
        "You don't have permission to remove timeout from members."
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
        message.channel.send("I was unable to remove timeout from the member.");
      });
  }

  let count = 0;
  // Command to delete a range of messages
  if (message.content.startsWith("!delete")) {
    if (!message.member.permissions.has("MANAGE_MESSAGES")) {
      return message.channel.send(
        "You don't have permission to delete messages."
      );
    }

    const args = message.content.split(" ");
    const amount = parseInt(args[1]);

    if (isNaN(amount) || amount <= 0 || amount > 100) {
      return message.channel.send(
        "Please provide a valid number of messages to delete (1-100)."
      );
    }

    const fetched = await message.channel.messages.fetch({ limit: amount });
    await message.channel.bulkDelete(fetched);
    message.channel.send(`Deleted ${fetched.size} messages.`);
  }
  // Command to display the member count

  if (message.content.startsWith("!membercount")) {
    const memberCount = message.guild.memberCount; // Get total member count
    message.channel.send(`Total members in this server: ${memberCount}`);
  }
  // Command to display the reputation leaderboard
  if (message.content === "!leaderboard") {
    // Check if the message is "!leaderboard"
    const leaderboard =
      Object.entries(reputation)
        .sort((a, b) => b[1] - a[1])
        .map(([userId, points]) => {
          const user = client.users.cache.get(userId); // Get the user object
          const username = user ? user.username : "Unknown User"; // Get username or fallback
          return `${username}: ${points} points`;
        })
        .join("\n") || "No reputation points yet.";

    message.channel.send(`**Reputation Leaderboard:**\n${leaderboard}`);
  }
});
const spamTrackers = new Map(); // Store spam data for each user

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
    const response = `Need study material? **Crack O/A Level has it all**! From engaging lectures to comprehensive notes to topical past papers. You can get them all and more.

**Any catch?**

Surprisingly, no. These websites require **no registering, are completely free and don't have advertisements**.

Visit now:
>>> **Crack O Level: https://crackolevel.wordpress.com**
**Crack A Level: https://crackalevel.wordpress.com**`;

    message.channel.send(response);
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
  // Command to timeout (mute) a user
  if (message.content.startsWith("!timeout")) {
    const args = message.content.split(" ");

    // Check if the user has permission to timeout members
    if (!message.member.permissions.has("MODERATE_MEMBERS")) {
      return message.channel.send(
        "You don't have permission to timeout members."
      );
    }

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
        return message.channel.send("Invalid time unit. Use s, m, h, d, or y.");
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
});
client.on("messageCreate", async (message) => {
  // Command to show help message in a specific channel
  if (
    message.content === "!help" &&
    message.channel.id === "1138487838837579813"
  ) {
    message.channel.send(`
        **Crack Bot Commands List:**

        > **1 ) Reputation**
        > Example: thank you @User,  ty @User, and thank @User
        > 
        > **2) Reputation Leaderboard**
        > Example: !leaderboard
        > 
        > **3) To kick someone**
        > Example: !kick @User 
        > 
        > **4) Banning someone**
        > Example: !ban @User 
        > 
        > **5) Unbanning someone**
        > Example: !unban @User
        > 
        > **6) Timing out someone**
        > Example: !timeout @User 10 m
        > 
        > case 's': // seconds
        > case 'm': // minutes  
        > case 'h': // hours
        > case 'd': // days
        > case 'y': // years
        > 
        > **7) Remove someone from timeout**
        > Example: !removetimeout @User
        > 
        > **8) Mute someone**
        > Example: !mute @User
        > 
        > **9) Unmute someone**
        > Example: !unmute @User
        > 
        > **10) Delete certain amount of messages (max 100)**
        > Example: !delete 50
        > 
        > **11) Make an announcement using the Bot**
        > Example: !announce New features have been added to the server!
        >
        > **11) Make an update using the Bot**
        > Example: !update New features have been added to the server!
        >
        > **12) Checking the member count**
        > example: !membercount
        `);
  }
});

//? Welcome People using Canvas!

// //! welcome the user when he/she joins it! [CLOSED !!!!!]

// client.on("guildMemberAdd", (member) => {
//   WelcomeNewMember(member);

// });

// type Imp = {
//   Roles: GuildMember,
// };

// client.on("GuildMember", (Roles) => {
//   checkRoles(Roles);
// });

// const checkRoles = (Roles) => {
//   if (
//     Roles.roles.cache.some((r) =>
//       ["IGCSE", "A2", "AS", "AS and A2"].includes(r.name)
//     )
//   ) {
//     channel.send(`it has this roles lol ${r.name}`);
//     // blacklist: mujtaba474
//   }
// };
// function WelcomeNewMember(member) {
//   const WELCOME_MESSAGES = [
//     `Welcome, ${member}!`,
//     `Glad to have you here, ${member}.`,
//     `${member}, how are you?`,
//     `Hi ${member}, we hope you brought a pizza`,
//     `${member}, Welcome buddy I hope you are having a great day !`,
//     `${member}, Please introduce about yourself`,
//     `Hi ${member}, welcome to crackAlevel offical server  `,
//     `${member}, Howdy!`,
//   ];

//   const channel = client.channels
//     .fetch("1297152392332181605")
//     .then((channel) => {
//       let welcomeMessage =
//         WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];

//       setTimeout(function () {
//         console.log("Welcoming a new member.");
//         channel.send(welcomeMessage);
//       }, 1000);
//     })
//     .catch(console.error);
// }
// Event handler for new member joins
// client.on("guildMemberAdd", async (member) => {
//   try {
//     // Create an embed with a description, title, and links
//     const welcomeEmbed = new EmbedBuilder()
//       .setColor(0x000000) // Set the color to black
//       .setTitle(
//         `Welcome ${member.user.username} to We Love Crack's Discord Server 👋 We hope you enjoy your time here 🙂`
//       ).setDescription(`

// Wish to access free study resources like engaging lectures, comprehensive notes, updated topical past papers, and more? Visit our websites now!

// [Crack A Level](https://crackalevel.wordpress.com/)
// [Crack O Level](https://crackolevel.wordpress.com/)
// `);

//     // Send a direct message to the new member
//     await member.send({ embeds: [welcomeEmbed] });
//     console.log(`Sent a welcome embed DM to ${member.user.tag}`);
//   } catch (error) {
//     console.error(
//       `Could not send DM to ${member.user.tag}. They might have DMs disabled.`
//     );
//   }
// });

// client.login(token);

// Log in to Discord with your app's token
client.login("TOKEN HERE");
