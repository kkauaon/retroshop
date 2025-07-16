const { Collection, ObjectId } = require("mongodb");
const bcrypt = require('bcrypt')

class UsersDAO {
    async setClient(client) {
        /**
         * @type {Collection}
         * @private
         */
        this.db = client.db("retroshop").collection("users")
    }


    async createUser({ email, nome, senha }) {
        const existing = await this.db.findOne({ email });
        if (existing) throw new Error('Email já registrado');

        const hashedPassword = await bcrypt.hash(senha, 10);
        const result = await this.db.insertOne({ email, name: nome, password: hashedPassword });

        return { _id: result.insertedId, email, name: nome };
    }

    async findByEmail(email) {
        return await this.db.findOne({ email });
    }

    async verifyUser(email, senha) {
        const user = await this.findByEmail(email);
        if (!user) throw new Error('Credenciais inválidas');

        const valid = await bcrypt.compare(senha, user.password);
        if (!valid) throw new Error('Credenciais inválidas');

        return { _id: user._id, name: user.name, email: user.email };
    }

    async findById(id) {
        return await this.db.findOne({ _id: new ObjectId(id) });
    }
}

module.exports = new UsersDAO();