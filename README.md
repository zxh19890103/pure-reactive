## a tiny tool to make `object` reactive, but without wrapping it.

## examples

```tsx

const person = {
    name: 'ronnie',
    age: 200,
}

const App = () => {
    const update = useReactive(person, 'name', 'age');

    return <div>
        <div>name: {person.name}</div>
        <div>age: {person.age}</div>
        <button onClick={() => {
            update(person, { age: person.age + 1 })
        }}>
            age+1
        </button>
    <div>
}

```