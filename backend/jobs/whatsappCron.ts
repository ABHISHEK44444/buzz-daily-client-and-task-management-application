

import cron from 'node-cron';
import User from '../models/User.js';
import FollowUp from '../models/FollowUp.js';

const sendWhatsAppMessage = async (to: string, message: string) => {
  console.log(`\n--- 🤖 CRON JOB TRIGGERED: DAILY AGENDA ---`);
  console.log(`📱 Target Phone: ${to}`);
  console.log(`📄 Message Body: \n${message}`);
  console.log(`--- END OF MESSAGE ---\n`);
};

export const initCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHH}:${currentMM}`;
    
    try {
      const usersToRemind = await User.find({ 
        agendaReminderTime: currentTime, 
        status: 'Active' 
      });

      if (usersToRemind.length === 0) return;

      for (const user of usersToRemind) {
        if (!user.phone) continue;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todaysCalls = await FollowUp.find({
          userId: user._id,
          nextFollowUpDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['Pending', 'In Progress'] }
        }).sort({ clientName: 1 });

        if (todaysCalls.length === 0) continue;

        let message = `*🚀 BizTrack Daily Outreach Agenda*\n\n`;
        message += `Hello ${user.name}, here is your structured call list for today:\n\n`;
        
        todaysCalls.forEach((call, index) => {
          message += `*${index + 1}. ${call.clientName}*\n`;
          message += `📝 _Context:_ ${call.notes || 'No notes provided.'}\n`;
          message += `📱 _Number:_ ${call.mobile}\n`;
          message += `-------------------\n\n`;
        });

        await sendWhatsAppMessage(user.phone, message);
      }
    } catch (error) {
      console.error('❌ Error in WhatsApp Cron Job:', error);
    }
  });
};
