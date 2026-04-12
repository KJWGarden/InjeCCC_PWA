import { hashPassword } from "../lib/password";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

hashPassword(password).then((hash) => {
  console.log(hash);
});
