// Utility to generate random number in range
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Generate dummy route between two rooms
function generateDummyRoute(startRoom, endRoom) {
  const stepsCount = Math.floor(randomInRange(3, 8));

  let steps = [];
  let currentX = randomInRange(0, 50);
  let currentY = randomInRange(0, 50);

  for (let i = 0; i < stepsCount; i++) {
    const nextX = currentX + randomInRange(-10, 10);
    const nextY = currentY + randomInRange(-10, 10);

    steps.push({
      step: i + 1,
      instruction: `Move to point (${nextX.toFixed(2)}, ${nextY.toFixed(2)})`,
      coordinates: {
        x: nextX,
        y: nextY
      },
      distance: Math.hypot(nextX - currentX, nextY - currentY).toFixed(2)
    });

    currentX = nextX;
    currentY = nextY;
  }

  return {
    from: startRoom,
    to: endRoom,
    totalSteps: steps.length,
    estimatedTime: `${(steps.length * 30)} sec`,
    path: steps
  };
}

// Example usage
const route = generateDummyRoute("Room A", "Room B");
console.log(route);