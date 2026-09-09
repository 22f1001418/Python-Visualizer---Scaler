import type { LensId } from '@/components/lenses/registry';

export interface Lesson {
  id: string;
  title: string;
  topic: string;
  /** One line, read aloud as the class opens the snippet. */
  blurb: string;
  source: string;
  stdin?: string;
  /** The lens this snippet was written to demonstrate. */
  lens?: LensId;
}

/**
 * The teaching deck.
 *
 * Each snippet is short enough to fit on a projector without scrolling and is
 * built to make exactly one idea visible in one lens. They are ordered the way a
 * foundations course runs, so the sidebar doubles as a syllabus.
 */
export const LESSONS: Lesson[] = [
  {
    id: 'variables',
    title: 'Variables and types',
    topic: 'Getting started',
    blurb: 'A name is a label put on a value, and the value has a type.',
    lens: 'stack',
    source: `name = "Diya"
age = 17
height = 1.62
is_student = True

print(name, age, height, is_student)
print(type(age), type(height))
`,
  },
  {
    id: 'strings',
    title: 'Text and f-strings',
    topic: 'Getting started',
    blurb: 'Building a sentence out of values, without gluing strings by hand.',
    lens: 'stack',
    source: `first = "Diya"
last = "Sharma"

full = first + " " + last
loud = full.upper()

print(f"{full} has {len(full)} characters")
print(loud, full.startswith("Diya"))
`,
  },
  {
    id: 'input',
    title: 'Reading input',
    topic: 'Getting started',
    blurb: 'input() always hands back text — even when the text looks like a number.',
    lens: 'stack',
    stdin: 'Kabir\n17\n',
    source: `who = input("Your name? ")
raw_age = input("Your age? ")

age = int(raw_age)

print(type(raw_age), type(age))
print(f"{who} turns {age + 1} next birthday")
`,
  },
  {
    id: 'decisions',
    title: 'if, elif, else',
    topic: 'Control flow',
    blurb: 'Only one branch runs. Step through and watch the others be skipped.',
    lens: 'stack',
    source: `score = 72

if score >= 90:
    grade = "A"
elif score >= 75:
    grade = "B"
elif score >= 60:
    grade = "C"
else:
    grade = "D"

print(score, "scores a", grade)
`,
  },
  {
    id: 'loops',
    title: 'Loops and a running total',
    topic: 'Control flow',
    blurb: 'The classic accumulator. The loop table fills itself in as it goes.',
    lens: 'loop',
    source: `marks = [72, 65, 88, 91]

total = 0
count = 0

for mark in marks:
    total = total + mark
    count = count + 1

average = total / count
print(f"{count} marks, average {average:.1f}")
`,
  },
  {
    id: 'while',
    title: 'while, and the loop that never ends',
    topic: 'Control flow',
    blurb: 'A while loop stops only when its condition turns False. Watch it approach.',
    lens: 'loop',
    source: `balance = 1000
years = 0

while balance < 2000:
    balance = balance + balance * 0.10
    years = years + 1

print(f"doubled after {years} years, balance {balance:.2f}")
`,
  },
  {
    id: 'lists',
    title: 'Lists and positions',
    topic: 'Collections',
    blurb: 'Positions start at 0, so the last one is len(x) - 1.',
    lens: 'structures',
    source: `cities = ["Pune", "Jaipur", "Kochi"]

cities.append("Shillong")
cities[1] = "Jodhpur"

print(cities[0], cities[-1])
print(len(cities), "cities")
print(cities[1:3])
`,
  },
  {
    id: 'aliasing',
    title: 'Two names, one list',
    topic: 'Collections',
    blurb: 'The one that catches everybody. b = a does not make a copy.',
    lens: 'memory',
    source: `original = [1, 2, 3]
alias = original
copy = original[:]

alias.append(4)
copy.append(99)

print("original:", original)
print("alias:   ", alias)
print("copy:    ", copy)
`,
  },
  {
    id: 'dicts',
    title: 'Dictionaries',
    topic: 'Collections',
    blurb: 'Looking things up by name instead of by position.',
    lens: 'structures',
    source: `ages = {"Diya": 17, "Kabir": 16}

ages["Meera"] = 18
ages["Kabir"] = 17

for name in ages:
    print(name, "is", ages[name])

print("Aarav" in ages, ages.get("Aarav", "unknown"))
`,
  },
  {
    id: 'sets-tuples',
    title: 'Sets and tuples',
    topic: 'Collections',
    blurb: 'One drops duplicates and has no order; the other cannot be changed at all.',
    lens: 'structures',
    source: `seen = {"red", "blue", "red", "green"}
point = (3, 7)

seen.add("blue")
seen.add("yellow")

x, y = point

print(len(seen), "unique colours")
print("x is", x, "and y is", y)
`,
  },
  {
    id: 'functions',
    title: 'Functions have their own variables',
    topic: 'Functions',
    blurb: 'A parameter is a new name inside the call, not the caller variable itself.',
    lens: 'stack',
    source: `def add_bonus(marks, bonus):
    marks = marks + bonus
    return marks


score = 72
final = add_bonus(score, 5)

print("score is still", score)
print("final is", final)
`,
  },
  {
    id: 'mutable-argument',
    title: 'Passing a list into a function',
    topic: 'Functions',
    blurb: 'The parameter is a new name — but it points at the caller’s own list.',
    lens: 'memory',
    source: `def add_topping(pizza, topping):
    pizza.append(topping)


order = ["cheese"]
add_topping(order, "basil")

print(order)
`,
  },
  {
    id: 'classes',
    title: 'Classes and objects',
    topic: 'Objects',
    blurb: 'What the class holds for everyone, and what each object holds for itself.',
    lens: 'objects',
    source: `class Student:
    school = "Scaler"

    def __init__(self, name):
        self.name = name
        self.marks = []

    def add(self, mark):
        self.marks.append(mark)

    def average(self):
        return sum(self.marks) / len(self.marks)


diya = Student("Diya")
kabir = Student("Kabir")

diya.add(72)
diya.add(88)
kabir.add(65)

print(diya.name, diya.average())
print(kabir.name, kabir.average())
print(diya.school, kabir.school)
`,
  },
  {
    id: 'generators',
    title: 'Generators pause instead of finishing',
    topic: 'Objects',
    blurb: 'Nothing runs until something asks for a value — and then it stops again.',
    lens: 'generator',
    source: `def countdown(start):
    current = start
    while current > 0:
        yield current
        current = current - 1


ticker = countdown(3)

print("made the generator, nothing has run yet")

for number in ticker:
    print(number)

print("lift off")
`,
  },
];

/** Lesson topics, in teaching order, with their snippets. */
export function lessonsByTopic(): Array<{ topic: string; lessons: Lesson[] }> {
  const groups: Array<{ topic: string; lessons: Lesson[] }> = [];

  for (const lesson of LESSONS) {
    const existing = groups.find((group) => group.topic === lesson.topic);
    if (existing) existing.lessons.push(lesson);
    else groups.push({ topic: lesson.topic, lessons: [lesson] });
  }

  return groups;
}
