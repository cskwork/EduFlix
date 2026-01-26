<!-- # English Content Generation Guide

## Subject Characteristics
English learning focuses on **vocabulary**, **grammar**, and **communication**.
Make learning fun through games, stories, and interactive exercises.

## Grade-Level Topics

### Elementary Lower (Grades 1-3)
- Alphabet & phonics
- Basic vocabulary (colors, numbers, animals)
- Simple greetings
- Short sentences
- Picture-word matching

### Elementary Upper (Grades 4-6)
- Expanded vocabulary
- Basic grammar (tenses, articles)
- Reading short paragraphs
- Simple conversations
- Writing short sentences

### Middle School (Grades 1-3)
- Complex sentences
- Various tenses
- Reading comprehension
- Essay basics
- Speaking practice

### High School (Grades 1-3)
- Advanced grammar
- Academic vocabulary
- Critical reading
- Debate and discussion
- Essay writing

## Content Types

### Vocabulary Games
- Word matching
- Picture dictionary
- Word safari/hunt
- Crossword puzzles
- Word building (prefixes/suffixes)

### Grammar Practice
- Fill in the blanks
- Sentence ordering
- Error correction
- Multiple choice
- Transformation exercises

### Reading Activities
- Interactive stories
- Comprehension quizzes
- Vocabulary in context
- Summary writing

### Speaking/Listening
- Dialogue practice
- Pronunciation guide
- Listening comprehension
- Role-playing scenarios

## Gamification Ideas

1. **Word Safari**: Find and collect words by category
2. **Grammar Quest**: Complete missions by fixing sentences
3. **Story Builder**: Create stories by choosing words
4. **Debate Arena**: Present arguments on topics
5. **Spelling Bee**: Spell words correctly to score

## Visual Design

### Typography
- Clear, readable fonts
- Highlight key words
- Use speech bubbles for dialogues

### Icons & Images
- Emoji for engagement 🎯 ⭐ 🏆
- Picture cards for vocabulary
- Character illustrations for stories

### Interactive Elements
- Drag and drop words
- Click to reveal answers
- Hover for definitions
- Audio playback buttons (visual indicator)

## CSS Color Guide

```css
:root {
  --english-primary: #FF6B6B;    /* English Red/Pink */
  --english-secondary: #FFA07A;
  --english-accent: #FFD93D;     /* Highlight Yellow */
  --english-correct: #6BCB77;    /* Correct Green */
  --english-wrong: #FF6B6B;      /* Wrong Red */
}
```

## Example Interactions

### Word Matching
```javascript
// Drag word to matching image
function matchWord(word, image) {
  if (isCorrectMatch(word, image)) {
    showSuccess();
    addScore(10);
  } else {
    showTryAgain();
  }
}
```

### Sentence Building
```javascript
// Arrange words in correct order
function checkSentence(words) {
  const sentence = words.join(' ');
  if (isGrammaticallyCorrect(sentence)) {
    showCelebration();
  }
}
```

### Fill in the Blank
```javascript
// Type or select the correct word
function checkAnswer(blank, answer) {
  if (answer.toLowerCase() === correctAnswer) {
    markCorrect(blank);
  } else {
    markIncorrect(blank);
    showHint();
  }
}
```

## Feedback Messages

### Correct
- "Excellent! 🎉"
- "Well done! ⭐"
- "Perfect! You're a star! 🌟"
- "Great job! Keep it up! 💪"

### Incorrect
- "Oops! Try again! 🔄"
- "Almost there! Think about it... 🤔"
- "Not quite. Here's a hint... 💡"

### Encouragement
- "You're doing great!"
- "Don't give up!"
- "Practice makes perfect!"

## Best Practices

1. **Use simple, clear language** appropriate for the grade level
2. **Provide context** for vocabulary words
3. **Include audio cues** (visual representation since actual audio not available)
4. **Celebrate achievements** with animations
5. **Offer hints** when struggling
6. **Show correct answers** after multiple attempts
7. **Track progress** visibly

## Important Notes

1. All text content should be in English
2. Instructions can be bilingual for lower grades
3. Use American English spelling by default
4. Include pronunciation guides where helpful
5. Avoid cultural bias in examples
6. Make content globally relatable -->
