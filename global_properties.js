var testing = true; // Make true the default fallback

try {
  // Only disable testing if the variable explicitly says "false"
  // If it is "true", empty, or undefined, it will skip this and remain true.
  if (import.meta.env.TESTING === "false") {
    testing = false;
  }
} catch (error) {
  // If accessing import.meta.env throws an error, the code ignores it 
  // and testing safely remains true.
}

export { testing };  