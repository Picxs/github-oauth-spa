class GitHubAPI {
    constructor(accessToken) {
        this.accessToken = accessToken;
    }

    async getUserInfo() {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        return response.json();
    }

    async getUserRepos() {
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        return response.json();
    }

    async createRepository(repoName, isPrivate = false) {
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: repoName,
                private: isPrivate,
                auto_init: true
            })
        });
        return response.json();
    }
}

export default GitHubAPI;