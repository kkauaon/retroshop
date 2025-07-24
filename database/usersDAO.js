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

    /**
     * Atualiza as informações de um usuário.
     * @param {string} userId - O ID do usuário a ser atualizado.
     * @param {object} userData - Os dados a serem atualizados (ex: { name, "contactInfo.whatsapp" }).
     * @returns {Promise<import('mongodb').UpdateResult>} O resultado da operação de atualização.
     */
    async updateUser(userId, userData) {
        try {
            // Previne a atualização de campos sensíveis como senha ou email por este método
            const allowedUpdates = {};
            if (userData.name) allowedUpdates.name = userData.name;
            if (userData.contactInfo) allowedUpdates.contactInfo = userData.contactInfo;

            if (Object.keys(allowedUpdates).length === 0) {
                throw new Error("Nenhum campo válido para atualização fornecido.");
            }
            
            return await this.db.updateOne(
                { _id: new ObjectId(userId) },
                { $set: allowedUpdates }
            );
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    }
}

module.exports = new UsersDAO();