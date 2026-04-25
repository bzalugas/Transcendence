import {
  profileInterests,
  profileFriends,
  profileActivity,
  profileSocials,
  currentProjects,
} from "@/lib/mocks/profile";

// Backend swap point: replace with `fetch('/api/profile/:username')`.
// For now this returns the current user's profile only.
export function getMyProfile() {
  return {
    interests: profileInterests,
    friends: profileFriends,
    activity: profileActivity,
    socials: profileSocials,
    currentProjects,
  };
}
