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
    {
        title: "Grimms' Fairy Tales",
        author: "Jacob Grimm and Wilhelm Grimm",
        url: "assets/Grimms' Fairy Tales--Jacob Grimm and Wilhelm Grimm.txt",
    },
    {
        title: "The Adventures of Sherlock Holmes",
        author: "Sir Arthur Conan Doyle",
        url: "assets/The Adventures of Sherlock Holmes--Sir Arthur Conan Doyle.txt",
    },
    {
        title: "The Prince",
        author: "Nicolo Machiavelli",
        url: "assets/The Prince--Nicolo Machiavelli.txt",
    },
    {
        title: "The Strange Case of Dr. Jekyll and Mr. Hyde",
        author: "Robert Louis Stevenson",
        url: "assets/The Strange Case of Dr. Jekyll and Mr. Hyde--Robert Louis Stevenson.txt",
    }
];
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
    line = line.toLowerCase();
    const positions = [];
    const lps = getLPS(searchPhrase);
    let i = 0,
        j = 0;
    while (i < line.length) {
        if (line[i] === searchPhrase[j]) {
            i++;
            j++;
        } else {
            if (j === 0) i++;
            else j = lps[j - 1];
        }
        if (j === searchPhrase.length) {
            positions.push(i - j);
            j = lps[j - 1];
        }
    }
    return positions;
};
const getText = async (path) => {
    const response = await fetch(path);
    return await response.text();
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
        this.lines = text
            .replaceAll("\r\n", "\n")
            .split("\n")
            .filter((line) => line.length > 0)
            .map((line) => line.trim());
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
        console.log(`searching for ${searchPhrase}`);
        const searchWords = searchPhrase.toLowerCase().split(" ");
        const firstWord = searchWords[0];
        const lastWord = searchWords[searchWords.length - 1];
        const middleWords = searchWords.slice(1, searchWords.length - 1);
        console.log(firstWord, this.index[firstWord]);
        if (this.index[firstWord] === undefined) return [];
        let lineNos = [...this.index[firstWord]];
        // lineNos.filter(lineNo => middleWords.find(word => this.index[word].has(lineNo)) !== undefined)
        middleWords.forEach((word) =>
            lineNos.filter((lineNo) => this.index[word]?.has(lineNo))
        );
        const instances = [];
        lineNos.forEach((lineNo) => {
            const positions = kmpStringMatch(this.lines[lineNo], searchPhrase);
            if (positions.length > 0)
                instances.push({
                    quote: this.lines[lineNo],
                    line: lineNo,
                    positions: positions,
                });
        });
        return instances;
    };
}
class Library {
    constructor(bookDetails) {
        this.bookDetails = bookDetails;
        this.books = {};
        this.linesSearched = 0
        this.getBooks();
    }
    getBooks = () => {
        // this.bookDetails.forEach((bookInfo, id) => {
        //     this.books[id] = new Book(
        //         id,
        //         bookInfo.title,
        //         bookInfo.author,
        //         bookInfo.url
        //     );
        // });
        showError(`Creating indices for ${this.bookDetails.length} books....`)
        Promise.all(this.bookDetails.map((bookInfo, id) => new Book(id, bookInfo.title, bookInfo.author, bookInfo.url))).then(books => {
            for (let i = 0; i < books.length; i++){
                const book = books[i]
                this.books[book.id] = book
            }
            showResultInfo(`Successfully created indices for ${books.length} books!!`)
        })
    };
    search = (searchPhrase) => {
        // search for searchPhrase in all books in the library
        // return object in the format {bookID: [{quote, line, position}]}
        this.linesSearched = 0
        console.log(`searching for ${searchPhrase}`);
        const instances = {};
        Object.keys(this.books).forEach((bookID) => {
            const instancesInBook = this.books[bookID].search(searchPhrase);
            if (instancesInBook.length > 0) instances[bookID] = instancesInBook;
            this.linesSearched += this.books[bookID].lines.length
        });
        return instances;
    };
}
const clearResults = () => {
    document.querySelectorAll(".book").forEach((book) => {
        book.parentElement?.removeChild(book);
    });
};
const showError = (message) => {
    const errorElement = document.querySelector('.error')
    const resultInfoElement = document.querySelector('.resultInfo')
    if (message.length === 0) {
        errorElement.classList.add('disappear')
        resultInfoElement.classList.remove('disappear')
    }
    else {
        errorElement.classList.remove('disappear')
        resultInfoElement.classList.add('disappear')
        errorElement.innerHTML = message
    }
}
const showResultInfo = (message) => {
    const resultInfoElement = document.querySelector('.resultInfo')
    const errorElement = document.querySelector('.error')
    if (message.length === 0) {
        resultInfoElement.classList.add('disappear')
        errorElement.classList.remove('disappear')
    }
    else {
        resultInfoElement.classList.remove('disappear')
        errorElement.classList.add('disappear')
        resultInfoElement.innerHTML = message
    }
}
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
    const initialTime = Date.now()
    showResultInfo("Loading...")
    const results = library.search(searchPhrase);
    const timeTaken = Date.now() - initialTime;
    showResultInfo(`Time taken to search ${library.linesSearched} lines = ${timeTaken} ms`)
    const resultsContainer = document.querySelector(".results");
    Object.keys(results).forEach((bookID) => {
        const bookNode = getBookNode(library.books[bookID], results[bookID]);
        resultsContainer.appendChild(bookNode);
    });
};
clearResults();

const library = new Library(bookDetails);
console.log(library);
const queryForm = document.querySelector("form");
queryForm.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(queryForm);
    const query = formData.get("search");
    if (query.length > 2) {
        showError("");
        searchAndDisplayResults(library, query);
    }
    else {
        showError("Enter query longer than 2 characters");
    }
};
