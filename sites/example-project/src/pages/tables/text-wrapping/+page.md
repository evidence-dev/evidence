---
title: Text Wrapping
---

A number of text wrapping cases in sql

## One long field

```sql book_info
select 
  'How to win friends and influence people' as title, 'Become genuinely interested in other people.
    Smile.
    Remember that a persons name is to that person the sweetest and most important sound in any language.
    Be a good listener. Encourage others to talk about themselves.
    Talk in terms of the other persons interests.
    Make the other person feel important – and do it sincerely.' as summary
union all
select 
  'The 7 Habits of Highly Effective People', 'Be Proactive.
    Begin with the End in Mind.
    Put First Things First.
    Think Win-Win.
    Seek First to Understand, Then to Be Understood.
    Synergize.
    Sharpen the Saw.' as summary
union all
select 
  'Never split the difference' as title, 'Never split the difference.
    Use tactical empathy.
    Silence is golden.
    Mirroring.
    Labeling.
    Accusation audit.
    Calibrated questions.
    No deal is better than a bad deal.' as summary
```



<DataTable data={book_info} />

<DataTable data={book_info} >
  <Column id="title" />
  <Column id="summary" wrap=true/>
</DataTable>

## Two long fields

```sql mit_courses
select 
  '6.0001' as course, 'Introduction to Computer Science and Programming in Python' as title, 'This course is the first of a two-course sequence: Introduction to Computer Science and Programming Using Python, and Introduction to Computational Thinking and Data Science. Together, they are designed to help people with no prior exposure to computer science or programming learn to think computationally and write programs to tackle useful problems. Some of the people taking the two courses will use them as a stepping stone to more advanced computer science courses, but for many it will be their first and last computer science courses. This run features lecture videos, lecture exercises, and problem sets using Python 3.5. Even if you previously took the course with Python 2.7, you will be able to easily transition to Python 3.5 in future courses, or enroll now to refresh your learning.' as description
union all
select
 '8.01' as course, 'Physics I: Classical Mechanics' as title, 'This freshman-level course is the second semester of introductory physics. The focus is on electricity and magnetism. The subject is taught using the TEAL (Technology Enabled Active Learning) format which utilizes small group interaction and current technology. The TEAL/Studio Project at MIT is a new approach to physics education designed to help students develop much better intuition about, and conceptual models of, physical phenomena.' as description
union all
select 
  '8.02' as course, 'Physics II: Electricity and Magnetism' as title, 'This freshman-level course is the second semester of introductory physics. The focus is on electricity and magnetism.' as description
union all
select 
  '8.03' as course, 'Physics III: Vibrations and Waves' as title, 'This freshman-level course is the third semester of introductory physics. The focus is on waves and relativity.' as description
union all
select 
  '9.00SC' as course, 'Introduction to Psychology' as title, 'This course is a survey of the scientific study of human nature, including how the mind works, and how the brain supports the mind. Topics include the mental and neural bases of perception, emotion, learning, memory, cognition, child development, personality, psychopathology, and social interaction. Students will consider how such knowledge relates to debates about nature and nurture, free will, consciousness, human differences, self, and society.' as description
```

<DataTable data={mit_courses}/>

<DataTable data={mit_courses} >
  <Column id="course" />
  <Column id="title" wrap=true/>
  <Column id="description" wrap=true/>
</DataTable>


## Table with Links

```sql hackernews
select 'Steven Hawking has died' as  title, 'https://news.ycombinator.com/item?id=16582136' as link, '2018-03-14' as date, 6015 as score, 'Cogito' as author
union all
select 'The CIA’s communications suffered a catastrophic compromise' as title, 'https://news.ycombinator.com/item?id=16582136' as link, '2018-03-14' as date, 6015 as score, 'epaga' as author
union all
select 'A message to Our Customers' as title, 'https://news.ycombinator.com/item?id=16582136' as link, '2016-02-15' as date, 5771 as score, 'epaga' as author
union all
select 'The FBI is creating a “nation of suspects”' as title, 'https://news.ycombinator.com/item?id=16582136' as link, '2016-02-15' as date, 5771 as score, 'patricktomas' as author
```

<DataTable data={hackernews} />

<DataTable data={hackernews} >
  <Column id="link" contentType=link linkLabel=title wrap=true/>
  <Column id="author" wrap=true/>
  <Column id="date" wrap=true/>
  <Column id="score" wrap=true/>
  
</DataTable>


