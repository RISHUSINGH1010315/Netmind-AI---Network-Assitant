import { Schema, model } from 'mongoose';

import { wrapModelWithProxy } from './modelProxy';

const ChatSessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    messages: [
      {
        sender: { type: String, enum: ['user', 'ai'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    contextFiles: [{ type: Schema.Types.ObjectId, ref: 'Configuration' }]
  },
  { timestamps: true }
);

const RealChatSession = model('ChatSession', ChatSessionSchema);
export const ChatSession = wrapModelWithProxy('ChatSession', RealChatSession);
export default ChatSession;
