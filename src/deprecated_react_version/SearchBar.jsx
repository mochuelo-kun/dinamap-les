import React, { useState } from 'react'
import './SearchBar.css'

const SearchBar = ({ onSearch, initialQuery = '' }) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery)

    const handleInputChange = (event) => {
        setSearchQuery(event.target.value)
    }

    //   const handleButtonClick = () => {
    //     onSearch(searchQuery);
    //   };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            onSearch(searchQuery)
        }
    }

    return (
        <div className="search-container">
            <input
                type="text"
                placeholder="Fly to..."
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
            />
            {/* <button onClick={handleButtonClick}>Search</button> */}
        </div>
    )
}

export default SearchBar
