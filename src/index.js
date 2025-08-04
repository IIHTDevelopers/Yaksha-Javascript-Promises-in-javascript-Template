// Fetching a post from JSONPlaceholder and then fetching the comments for that post
function fetchPostAndComments(postId) {
  return new Promise((resolve, reject) => {
    fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        return response.json();
      })
      .then(post => {
        console.log('Post fetched:', post.title);  // Log the post title
        // Now fetch the comments for the fetched post
        return fetch(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`);
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        return response.json();
      })
      .then(comments => {
        console.log('Comments fetched:', comments.length);  // Log the number of comments
        resolve(comments);  // Resolve the promise with the comments data
      })
      .catch(error => {
        reject(error);  // Reject the promise with the error
      });
  });
}

// Use the function to fetch data
fetchPostAndComments(1)
  .then(comments => {
    console.log('Data processing completed');
  })
  .catch(error => {
    console.error('Error occurred:', error);
  });
