class ListingsDAO {
    constructor(client) {
        this.client = client;

        this.db = client.db("retroshop").collection("listings")
    }
}

module.exports = ListingsDAO;