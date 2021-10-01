const resultsContainer = document.querySelector(".results");
const bookDetails = [
    {
        title: "Alice’s Adventures in Wonderland",
        author: "Lewis Carroll",
        url: "assets/Alice’s Adventures in Wonderland--Lewis Carrol.txt",
    },
    {
        title: "The Scarlet Letter",
        author: "Nathaniel Hawthorne",
        url: "assets/The Scarlet Letter--Nathaniel Hawthorne.txt",
    },
];
// const hash = (str) => {
//     let hashValue = 0
//     for (let i = 0; i < str; i++){
//         hashValue += str.charCodeAt(i)
//     }
// }
// const rkStringMatch = (line, searchPhrase) => {
//     // rabin karp string matching
// }
const getLPS = (str) => {
    let i = 1,
        j = 0,
        lps = [0];
    while (i < str.length) {
        if (str[j] == str[i]) {
            j++;
        } else {
            j = 0;
        }
        lps.push(j);
        i++;
    }
    return lps;
};
const kmpStringMatch = (line, searchPhrase) => {
    line = line.toLowerCase()
    const positions = [];
    const lps = getLPS(searchPhrase);
    let i = 0,
        j = 0;
    while (i < line.length) {
        if (line[i] === searchPhrase[j]) {
            i++;
            j++;
        } else {
            if(j === 0) i++
            else j = lps[j - 1]
        }
        if (j === searchPhrase.length) {
            positions.push(i - j)
            j = lps[j - 1]
        }
    }
    return positions;
};
class Book {
    constructor(id, title, author, url) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.url = url;
        this.index = {};
        this.lines = [];
        this.createIndex();
    }
    populateContent = async () => {
        const text = await getText(this.url);
        this.lines = text.split("\r\n").filter((line) => line.length > 0);
    };
    createIndex = async () => {
        await this.populateContent();
        this.lines.forEach((line, lineNo) => {
            line.replaceAll(/[^\w]/g, " ")
                .split(/\s+/)
                .forEach((newWord) => {
                    newWord = newWord.toLowerCase();
                    if (newWord.length == 0) return;
                    if (this.index[newWord] === undefined)
                        this.index[newWord] = new Set();
                    this.index[newWord].add(lineNo);
                });
        });
        console.log(
            `Index size of ${this.title} is ${Object.keys(this.index).length}`
        );
    };
    search = (searchPhrase) => {
        // search for searchPhrase in the book
        // return object in the format {bookID: {title, author, quote, line, positions}}
        console.log(`searching for ${searchPhrase}`)
        const searchWords = searchPhrase.toLowerCase().split(" ");
        const firstWord = searchWords[0];
        const lastWord = searchWords[searchWords.length - 1];
        const middleWords = searchWords.slice(1, searchWords.length - 1);
        console.log(firstWord, this.index[firstWord])
        if(this.index[firstWord] === undefined)
        return []
        let lineNos = [...this.index[firstWord]];
        // lineNos.filter(lineNo => middleWords.find(word => this.index[word].has(lineNo)) !== undefined)
        middleWords.forEach((word) =>
            lineNos.filter((lineNo) => this.index[word]?.has(lineNo))
        );
        const instances = []
        lineNos.forEach(lineNo => {
            const positions = kmpStringMatch(this.lines[lineNo], searchPhrase)
            if(positions.length > 0)
                instances.push({
                    quote: this.lines[lineNo],
                    line: lineNo,
                    positions: positions
                })
        })
        return instances
    };
}
class Library {
    constructor(bookDetails) {
        this.bookDetails = bookDetails;
        this.books = {};
        this.getBooks();
    }
    getBooks = () => {
        this.bookDetails.forEach((bookInfo, id) => {
            this.books[id] = new Book(
                bookInfo.id,
                bookInfo.title,
                bookInfo.author,
                bookInfo.url
            );
        });
    };
    search = (searchPhrase) => {
        // search for searchPhrase in all books in the library
        // return object in the format {bookID: [{quote, line, position}]}
        console.log(`searching for ${searchPhrase}`)
        const instances = {}
        Object.keys(this.books).forEach(bookID => {
            const instancesInBook = this.books[bookID].search(searchPhrase)
            if(instancesInBook.length > 0)
                instances[bookID] = instancesInBook
        })
        return instances
        // return {
        //     0: [
        //         {
        //             quote: "this is the first quote",
        //             line: 1000,
        //             position: 50,
        //         },
        //         {
        //             quote: "this is the second quote",
        //             line: 1000,
        //             position: 50,
        //         },
        //     ],
        //     1: [
        //         {
        //             quote: "this is the first quote",
        //             line: 1000,
        //             position: 50,
        //         },
        //         {
        //             quote: "this is the second quote",
        //             line: 1000,
        //             position: 50,
        //         },
        //     ],
        // };
    };
}
const getText = async (path) => {
    const response = await fetch(path);
    return await response.text();
};
const clearResults = () => {
    document.querySelectorAll(".book").forEach((book) => {
        book.parentElement?.removeChild(book);
    });
};
const getCurrentQuery = () => {
    const queries = new URLSearchParams(window.location.search);
    return queries.get("search");
};
const getInstancesNode = (instances) => {
    console.log({ instances });
    const instancesNode = document.createElement("div");
    instancesNode.classList.add("instances");
    instances.forEach((instance) => {
        const instanceNode = document.createElement("div");
        instanceNode.classList.add("instance");

        const quoteNode = document.createElement("div");
        quoteNode.classList.add("quote");
        quoteNode.innerText = instance.quote;
        instanceNode.appendChild(quoteNode);

        const lineNode = document.createElement("div");
        lineNode.classList.add("line");
        lineNode.innerText = `Line: ${instance.line}`;
        instanceNode.appendChild(lineNode);

        const positionNode = document.createElement("div");
        positionNode.classList.add("position");
        positionNode.innerText = `Positions: ${instance.positions.join(", ")}`;
        instanceNode.appendChild(positionNode);

        instancesNode.appendChild(instanceNode);
    });
    return instancesNode;
};
const getBookNode = (book, results) => {
    const bookNode = document.createElement("details");
    bookNode.classList.add("book");
    bookNode.id = `book-${book.id}`;

    const header = document.createElement("summary");
    header.classList.add("header");

    const titleContainer = document.createElement("div");
    titleContainer.classList.add("title");
    const title = document.createElement("h1");
    title.innerText = book.title;
    titleContainer.appendChild(title);
    header.appendChild(titleContainer);

    const authorContainer = document.createElement("div");
    authorContainer.classList.add("author");
    const author = document.createElement("h3");
    author.innerText = book.author;
    authorContainer.appendChild(author);
    header.appendChild(authorContainer);

    bookNode.appendChild(header);

    const instancesNode = getInstancesNode(results);
    bookNode.appendChild(instancesNode);
    return bookNode;
};
const searchAndDisplayResults = (library, searchPhrase) => {
    clearResults();
    const results = library.search(searchPhrase);
    const resultsContainer = document.querySelector(".results");
    Object.keys(results).forEach((bookID) => {
        const bookNode = getBookNode(library.books[bookID], results[bookID]);
        resultsContainer.appendChild(bookNode);
    });
};
clearResults();

const library = new Library(bookDetails);
console.log(library);
const queryForm = document.querySelector("form")
queryForm.onsubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(queryForm)
    const query = formData.get("search")
    if(query.length > 5)
        searchAndDisplayResults(library, query);
}
