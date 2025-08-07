const axios = require("axios");

const sendLineNotify = async (userId, message) => {
  console.log("userId ", userId);
  console.log("message ", message);
  const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  // const CHANNEL_ACCESS_TOKEN =
  //   "ER8oSzlDDk1H8HkkBNoyBUNntemq0GJdhVjnA3IVJMAh+PNOjFlHnVH95qmPJKu4co7EgKK2Pip86q52zMn8t1CNqAq+pofA3le3t0WmJsVg8V0Jqmhh0FKjXNb98ighg6CHJT4rvaEKd6H0UUM5zwdB04t89/1O/w1cDnyilFU=";

  let messagesPayload;
  if (typeof message === "string") {
    messagesPayload = [{ type: "text", text: message }];
  } else if (typeof message === "object" && message !== null) {
    messagesPayload = [message];
  } else {
    throw new Error("Invalid message format");
  }

  const response = await axios.post(
    "https://api.line.me/v2/bot/message/push",
    {
      to: userId,
      messages: messagesPayload,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );

  return response.data;
};

// const sendLineNotify = async (userId, message) => {
//   const CHANNEL_ACCESS_TOKEN =
//     "ER8oSzlDDk1H8HkkBNoyBUNntemq0GJdhVjnA3IVJMAh+PNOjFlHnVH95qmPJKu4co7EgKK2Pip86q52zMn8t1CNqAq+pofA3le3t0WmJsVg8V0Jqmhh0FKjXNb98ighg6CHJT4rvaEKd6H0UUM5zwdB04t89/1O/w1cDnyilFU=";

//   let messagesPayload;
//   if (typeof message === "string") {
//     messagesPayload = [{ type: "text", text: message }];
//   } else if (typeof message === "object" && message !== null) {
//     messagesPayload = [message];
//   } else {
//     throw new Error("Invalid message format");
//   }

//   console.log("📤 Sending message:");
//   console.log("to:", userId);
//   console.log("messagesPayload:", JSON.stringify(messagesPayload, null, 2));

//   try {
//     const response = await axios.post(
//       "https://api.line.me/v2/bot/message/push",
//       {
//         to: userId,
//         messages: messagesPayload,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
//         },
//       }
//     );

//     console.log("✅ Message sent:", response.data);
//     return response.data;
//   } catch (error) {
//     console.error(
//       "❌ LINE API error:",
//       error.response?.status,
//       error.response?.data
//     );
//     throw error;
//   }
// };

module.exports = { sendLineNotify }; // ✅ ส่งออกเป็น object
