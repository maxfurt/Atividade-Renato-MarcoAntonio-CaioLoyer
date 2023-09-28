import { openDB } from "idb";

let db;
async function criarDB(){
    try {
        db = await openDB('banco', 1, {
            upgrade(db, oldVersion, newVersion, transaction){
                switch  (oldVersion) {
                    case 0:
                    case 1:
                        const store = db.createObjectStore('anotacao', {
                            keyPath: 'titulo'
                        });
                        store.createIndex('id', 'id');
                        console.log("banco de dados criado!");
                }
            }
        });
        console.log("banco de dados aberto!");
    }catch (e) {
        console.log('Erro ao criar/abrir banco: ' + e.message);
    }
}

window.addEventListener('DOMContentLoaded', async event =>{
    criarDB();
    document.getElementById('btnCadastro').addEventListener('click', adicionarAnotacao);
    document.getElementById('btnCarregar').addEventListener('click', buscarTodasAnotacoes);
    document.getElementById('btnDeletar').addEventListener('click', deletarTodasAnotacao);
});

async function buscarTodasAnotacoes(){
    if(db == undefined){
        console.log("O banco de dados está fechado.");
    }
    const tx = await db.transaction('anotacao', 'readonly');
    const store = await tx.objectStore('anotacao');
    const anotacoes = await store.getAll();
    if(anotacoes){
        const divLista = anotacoes.map(anotacao => {
            return `<div class="item">
                    <p>Anotação</p>
                    <p>${anotacao.titulo} - ${anotacao.data} </p>
                    <p>${anotacao.categoria}</p>
                    <p>${anotacao.descricao}</p>
                   </div>`;
        });
        listagem(divLista.join(' '));
    }
}

async function adicionarAnotacao() {
    let titulo = document.getElementById("titulo").value;
    let categoria = document.getElementById("categoria").value;
    let descricao = document.getElementById("descricao").value;
    let data = document.getElementById("data").value;
    const tx = await db.transaction('anotacao', 'readwrite')
    const store = tx.objectStore('anotacao');
    try {
        await store.add({ titulo: titulo, categoria: categoria, descricao: descricao, data: data });
        await tx.done;
        limparCampos();
        console.log('Registro adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar registro:', error);
        tx.abort();
    }
}

async function deletarTodasAnotacao() {
    const tx = await db.transaction('anotacao', 'readwrite');
    const store = tx.objectStore('anotacao');
    try {
        await store.clear(); 
        await tx.done;
        console.log('Todas as anotações foram excluídas com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir todas as anotações:', error);
        tx.abort();
    }
}

async function buscarTodasAnotacoesParaAtualizar() {
    if (db == undefined) {
        console.log("O banco de dados está fechado.");
    }
    const tx = await db.transaction('anotacao', 'readonly');
    const store = await tx.objectStore('anotacao');
    const anotacoes = await store.getAll();
    if (anotacoes) {
        const selectAnotacao = document.getElementById('anotacaoParaAtualizar');
        selectAnotacao.innerHTML = "<option value=''>Selecione uma Anotação</option>";
        anotacoes.forEach(anotacao => {
            const option = document.createElement('option');
            option.value = anotacao.titulo;
            option.textContent = `${anotacao.titulo} - ${anotacao.data}`;
            selectAnotacao.appendChild(option);
        });
    }
}

document.getElementById('btnCarregar').addEventListener('click', buscarTodasAnotacoesParaAtualizar);
document.getElementById('btnAtualizar').addEventListener('click', async () => {
    const tituloParaAtualizar = document.getElementById('anotacaoParaAtualizar').value;
    const novaDescricao = document.getElementById('novaDescricao').value;
    const novaCategoria = document.getElementById('novaCategoria').value;
    const novaData = document.getElementById('novaData').value;

    if (!tituloParaAtualizar) {
        console.log('Selecione uma anotação para atualizar.');
        return;
    }

    const tx = await db.transaction('anotacao', 'readwrite');
    const store = tx.objectStore('anotacao');

    try {
        const anotacaoExistente = await store.get(tituloParaAtualizar);
        if (!anotacaoExistente) {
            console.log('A anotação selecionada não foi encontrada.');
            return;
        }
        if (novaDescricao) {
            anotacaoExistente.descricao = novaDescricao;
        }
        if (novaCategoria) {
            anotacaoExistente.categoria = novaCategoria;
        }
        if (novaData) {
            anotacaoExistente.data = novaData;
        }

        await store.put(anotacaoExistente);
        await tx.done;
        console.log('Anotação atualizada com sucesso!');
        limparCampos();
    } catch (error) {
        console.error('Erro ao atualizar anotação:', error);
        tx.abort();
    }
});


function limparCampos() {
    document.getElementById("titulo").value = '';
    document.getElementById("categoria").value = '';
    document.getElementById("descricao").value = '';
    document.getElementById("data").value = '';
}

function listagem(text){
    document.getElementById('resultados').innerHTML = text;
}
