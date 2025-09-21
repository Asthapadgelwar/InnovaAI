import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
  try {
    const { userId, has } = await req.auth();
    const hasPremiumPlan = await has({ plan: 'premium' });
    const user = await clerkClient.users.getUser(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const freeUsage = user.privateMetadata.free_usage || 0;

    if (!hasPremiumPlan && freeUsage) {
      req.free_usage = freeUsage;
    } else {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: 0 }
      });
      req.free_usage = 0;
    }

    req.plan = hasPremiumPlan ? 'premium' : 'free';
    next();
  } catch (error) {
    console.error(error);  // Log the error for debugging purposes
    res.json({ success: false, message: error.message });
  }
};
