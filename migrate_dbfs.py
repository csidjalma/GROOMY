import os
import pymysql
from dbfread import DBF
from sshtunnel import SSHTunnelForwarder
import datetime

# Configuration
DBF_DIR = r"C:\AI-PROJECTS\GROOMY\CSISYS\Dados"
SSH_HOST = "135.181.254.249"
SSH_PORT = 9222
SSH_USER = "root"
SSH_PASS = "(t-M2Cy[IGZD"

MYSQL_PORT = 3308
MYSQL_USER = "csi_super"
MYSQL_PASS = "NL2Gu7JdlsKISSlS8PI0qp"
DB_NAME = "devcs_banco_groomy"

# Batch size for bulk insertions
BATCH_SIZE = 2000

def get_field_by_prefix(record, prefix):
    for k in record.keys():
        if k.upper().startswith(prefix.upper()):
            return record[k]
    return None

def clean_val(val):
    if isinstance(val, str):
        return val.strip()
    if isinstance(val, (datetime.date, datetime.datetime)):
        if hasattr(val, 'year') and val.year < 1900:
            return None
        return val
    return val

def run_migration():
    print("Opening SSH Tunnel...")
    with SSHTunnelForwarder(
        (SSH_HOST, SSH_PORT),
        ssh_username=SSH_USER,
        ssh_password=SSH_PASS,
        remote_bind_address=('127.0.0.1', MYSQL_PORT),
        local_bind_address=('127.0.0.1', MYSQL_PORT)
    ) as tunnel:
        print(f"Tunnel active. Connecting to MySQL: {DB_NAME}...")
        
        connection = pymysql.connect(
            host='127.0.0.1',
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASS,
            database=DB_NAME,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        try:
            # Disable foreign key checks
            with connection.cursor() as cursor:
                cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
                cursor.execute("TRUNCATE TABLE clientes;")
                cursor.execute("TRUNCATE TABLE profissionais;")
                cursor.execute("TRUNCATE TABLE servicos;")
                cursor.execute("TRUNCATE TABLE agenda_vfp;")
                cursor.execute("TRUNCATE TABLE atendimentos;")
                cursor.execute("TRUNCATE TABLE itens_atendimento;")
                cursor.execute("TRUNCATE TABLE pagamentos;")
                cursor.execute("TRUNCATE TABLE comissoes;")
                cursor.execute("TRUNCATE TABLE produtos;")
                cursor.execute("TRUNCATE TABLE servicos_profissional;")
                cursor.execute("TRUNCATE TABLE caixa;")
                cursor.execute("TRUNCATE TABLE despesas;")
                cursor.execute("TRUNCATE TABLE bandeiras;")
                cursor.execute("TRUNCATE TABLE atividades;")
                cursor.execute("TRUNCATE TABLE pedidos;")
                connection.commit()

            # Core Tables
            migrate_clientes(connection)
            migrate_profissionais(connection)
            migrate_servicos(connection)
            migrate_agenda(connection)
            migrate_atendimentos(connection)
            migrate_itens_atendimento(connection)
            migrate_pagamentos(connection)
            migrate_comissoes(connection)
            
            # Supplementary Tables
            migrate_produtos(connection)
            migrate_servicos_profissional(connection)
            migrate_caixa(connection)
            migrate_despesas(connection)
            migrate_bandeiras(connection)
            migrate_atividades(connection)
            migrate_pedidos(connection)

            # Re-enable foreign key checks
            with connection.cursor() as cursor:
                cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
                connection.commit()
                print("Foreign key checks re-enabled.")
                
        finally:
            connection.close()

def migrate_clientes(connection):
    path = os.path.join(DBF_DIR, "CLIENTE.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "cliente.dbf")
    
    print(f"\nMigrating Clientes from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO clientes (
            id_legado, nome, telefone, telefone2, celular, cep, rua, numero,
            bairro, cidade, uf, complemento, data_nascimento, email,
            credito, sexo, usuario, data_alteracao
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    count = 0
    for record in dbf:
        row = (
            clean_val(record.get('CL_CODIGO')),
            clean_val(record.get('CL_NOME')),
            clean_val(record.get('CL_TELEFON')),
            clean_val(record.get('CL_TELEFO2')),
            clean_val(record.get('CL_CELULAR')),
            clean_val(record.get('CL_CEP')),
            clean_val(record.get('CL_RUA')),
            clean_val(record.get('CL_NUMERO')),
            clean_val(record.get('CL_BAIRRO')),
            clean_val(record.get('CL_CIDADE')),
            clean_val(record.get('CL_UF')),
            clean_val(record.get('CL_COMPLEM')),
            clean_val(record.get('CL_ANIVERS')),
            clean_val(record.get('CL_EMAIL')),
            clean_val(record.get('CL_CREDITO')),
            clean_val(record.get('CL_SEXO')),
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA'))
        )
        batch.append(row)
        if len(batch) >= BATCH_SIZE:
            with connection.cursor() as cursor:
                cursor.executemany(sql, batch)
            connection.commit()
            count += len(batch)
            print(f"Migrated {count} clientes...")
            batch = []
            
    if batch:
        with connection.cursor() as cursor:
            cursor.executemany(sql, batch)
        connection.commit()
        count += len(batch)
        print(f"Finished Clientes: {count} records.")

def migrate_profissionais(connection):
    path = os.path.join(DBF_DIR, "PROFISSIONAIS.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "profissionais.dbf")
        
    print(f"\nMigrating Profissionais from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO profissionais (
            id_legado, nome, telefone, celular, comissao, comissao2, especialidade,
            saldo, cep, rua, numero, complemento, bairro, cidade, uf,
            data_nascimento, usuario, data_alteracao, ativo
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    for record in dbf:
        is_active = 1
        id_ativida = record.get('ID_ATIVIDA')
        if id_ativida is not None and str(id_ativida).strip() != "" and int(id_ativida) > 0:
            is_active = 0
            
        row = (
            clean_val(record.get('PF_CODIGO')),
            clean_val(record.get('PF_NOME')),
            clean_val(record.get('PF_TELEFON')),
            clean_val(record.get('PF_CELULAR')),
            clean_val(record.get('PF_COMISSA')),
            clean_val(record.get('PF_COMISS2')),
            clean_val(record.get('PF_ESPECIA')),
            clean_val(record.get('PF_SALDO')),
            clean_val(record.get('PF_CEP')),
            clean_val(record.get('PF_RUA')),
            clean_val(record.get('PF_NUMERO')),
            clean_val(record.get('PF_COMPLEM')),
            clean_val(record.get('PF_BAIRRO')),
            clean_val(record.get('PF_CIDADE')),
            clean_val(record.get('PF_UF')),
            clean_val(record.get('PF_ANIVERS')),
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA')),
            is_active
        )
        batch.append(row)
        
    with connection.cursor() as cursor:
        cursor.executemany(sql, batch)
    connection.commit()
    print(f"Finished Profissionais: {len(batch)} records.")

def migrate_servicos(connection):
    path = os.path.join(DBF_DIR, "SERVIÇOS.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "SERVIÇOS.dbf")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "servico.dbf")
        if not os.path.exists(path):
            path = os.path.join(DBF_DIR, "serviços.dbf")
            
    print(f"\nMigrating Serviços from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO servicos (
            id_legado, descricao, preco, abreviacao, usuario, data_alteracao
        ) VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    for record in dbf:
        desc = get_field_by_prefix(record, 'SE_DESCRI')
        preco = get_field_by_prefix(record, 'SE_PRE')
        
        row = (
            clean_val(record.get('SE_CODIGO')),
            clean_val(desc),
            clean_val(preco),
            clean_val(record.get('SE_ABREVIA')),
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA'))
        )
        batch.append(row)
        
    with connection.cursor() as cursor:
        cursor.executemany(sql, batch)
    connection.commit()
    print(f"Finished Serviços: {len(batch)} records.")

def migrate_agenda(connection):
    path = os.path.join(DBF_DIR, "AGENDA.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "agenda.dbf")
        
    print(f"\nMigrating Agenda from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    cols_to_map = []
    for hour in range(7, 22):
        for minute in (0, 30):
            if hour == 21 and minute == 30:
                break
            cols_to_map.append(f"H{hour:02d}{minute:02d}")
            
    sql_cols = ", ".join(cols_to_map)
    sql_placeholders = ", ".join(["%s"] * (2 + len(cols_to_map)))
    sql = f"""
        INSERT IGNORE INTO agenda_vfp (
            data_agenda, profissional_id_legado, {sql_cols}
        ) VALUES ({sql_placeholders})
    """
    
    batch = []
    count = 0
    for record in dbf:
        row = [
            clean_val(record.get('AG_DATA')),
            clean_val(record.get('PF_CODIGO'))
        ]
        for col in cols_to_map:
            row.append(clean_val(record.get(col)))
            
        batch.append(tuple(row))
        if len(batch) >= BATCH_SIZE:
            with connection.cursor() as cursor:
                cursor.executemany(sql, batch)
            connection.commit()
            count += len(batch)
            print(f"Migrated {count} agenda records...")
            batch = []
            
    if batch:
        with connection.cursor() as cursor:
            cursor.executemany(sql, batch)
        connection.commit()
        count += len(batch)
        print(f"Finished Agenda: {count} records.")

def migrate_atendimentos(connection):
    path = os.path.join(DBF_DIR, "ATENDIMENTO.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "atendimento.dbf")
        
    print(f"\nMigrating Atendimentos from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO atendimentos (
            id_legado, cliente_id_legado, preco_total, data_inicio, status_atend,
            valor_dinheiro, valor_cartao, valor_cheque, imprime, usuario, data_alteracao, desconto
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    count = 0
    for record in dbf:
        preco_total = get_field_by_prefix(record, 'AT_PRE')
        status_val = record.get('AT_STATUS')
        status_int = 1 if status_val else 0
        
        row = (
            clean_val(record.get('AT_CODIGO')),
            clean_val(record.get('CL_CODIGO')),
            clean_val(preco_total),
            clean_val(record.get('AT_INICIO')),
            status_int,
            clean_val(record.get('AT_DINHEIR')),
            clean_val(record.get('AT_CARTAO')),
            clean_val(record.get('AT_CHEQUE')),
            1 if record.get('AT_IMPRIME') else 0,
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA')),
            clean_val(record.get('AT_DESCONT'))
        )
        batch.append(row)
        if len(batch) >= BATCH_SIZE:
            with connection.cursor() as cursor:
                cursor.executemany(sql, batch)
            connection.commit()
            count += len(batch)
            print(f"Migrated {count} atendimentos...")
            batch = []
            
    if batch:
        with connection.cursor() as cursor:
            cursor.executemany(sql, batch)
        connection.commit()
        count += len(batch)
        print(f"Finished Atendimentos: {count} records.")

def migrate_itens_atendimento(connection):
    path = os.path.join(DBF_DIR, "ITENS_ATEND.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "itens_atend.dbf")
        
    print(f"\nMigrating Itens Atendimento from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO itens_atendimento (
            atendimento_id_legado, cliente_id_legado, item_id_legado, profissional_id_legado,
            quantidade, valor, descricao, tipo, data_item, usuario, data_alteracao
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    count = 0
    for record in dbf:
        desc = get_field_by_prefix(record, 'IA_DESCRI')
        
        row = (
            clean_val(record.get('AT_CODIGO')),
            clean_val(record.get('CL_CODIGO')),
            clean_val(record.get('IA_CODIGO')),
            clean_val(record.get('PF_CODIGO')),
            clean_val(record.get('IA_QUANT')),
            clean_val(record.get('IA_VALOR')),
            clean_val(desc),
            clean_val(record.get('IA_TIPO')),
            clean_val(record.get('IA_DATA')),
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA'))
        )
        batch.append(row)
        if len(batch) >= BATCH_SIZE:
            with connection.cursor() as cursor:
                cursor.executemany(sql, batch)
            connection.commit()
            count += len(batch)
            print(f"Migrated {count} itens_atendimento...")
            batch = []
            
    if batch:
        with connection.cursor() as cursor:
            cursor.executemany(sql, batch)
        connection.commit()
        count += len(batch)
        print(f"Finished Itens Atendimento: {count} records.")

def migrate_pagamentos(connection):
    path = os.path.join(DBF_DIR, "ITENS_PAGAMENTO.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "itens_pagamento.dbf")
        
    print(f"\nMigrating Pagamentos from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO pagamentos (
            atendimento_id_legado, data_pagamento, valor_dinheiro, valor_cartao, valor_cheque,
            data_inicio, cheque_codigo, banco_codigo, usuario, data_alteracao, desconto
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    count = 0
    for record in dbf:
        row = (
            clean_val(record.get('AT_CODIGO')),
            clean_val(record.get('IP_DATA')),
            clean_val(record.get('IP_DINHEIR')),
            clean_val(record.get('IP_CARTAO')),
            clean_val(record.get('IP_CHEQUE')),
            clean_val(record.get('AT_INICIO')),
            clean_val(record.get('CH_CODIGO')),
            clean_val(record.get('BA_CODIGO')),
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA')),
            clean_val(record.get('IP_DESCONT'))
        )
        batch.append(row)
        if len(batch) >= BATCH_SIZE:
            with connection.cursor() as cursor:
                cursor.executemany(sql, batch)
            connection.commit()
            count += len(batch)
            print(f"Migrated {count} pagamentos...")
            batch = []
            
    if batch:
        with connection.cursor() as cursor:
            cursor.executemany(sql, batch)
        connection.commit()
        count += len(batch)
        print(f"Finished Pagamentos: {count} records.")

def migrate_comissoes(connection):
    path = os.path.join(DBF_DIR, "COMISSAO.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "comissao.dbf")
        
    print(f"\nMigrating Comissões from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO comissoes (
            id_legado, profissional_id_legado, atendimento_id_legado, cliente_id_legado,
            item_codigo, nome_item, tipo, data_atendimento, data_pagamento, valor,
            status_pago, servico_id_legado, data_baixa, usuario, data_alteracao
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    count = 0
    for record in dbf:
        status_val = record.get('CO_STATUS')
        status_pago = 1 if status_val else 0
        
        row = (
            clean_val(record.get('ID')),
            clean_val(record.get('PF_CODIGO')),
            clean_val(record.get('AT_CODIGO')),
            clean_val(record.get('CL_CODIGO')),
            clean_val(record.get('CO_CODIGO')),
            clean_val(record.get('CO_NOME')),
            clean_val(record.get('CO_TIPO')),
            clean_val(record.get('CO_DATEND')),
            clean_val(record.get('CO_DPAGA')),
            clean_val(record.get('CO_VALOR')),
            status_pago,
            clean_val(record.get('SE_CODIGO')),
            clean_val(record.get('CO_DBAIXA')),
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA'))
        )
        batch.append(row)
        if len(batch) >= BATCH_SIZE:
            with connection.cursor() as cursor:
                cursor.executemany(sql, batch)
            connection.commit()
            count += len(batch)
            print(f"Migrated {count} comissões...")
            batch = []
            
    if batch:
        with connection.cursor() as cursor:
            cursor.executemany(sql, batch)
        connection.commit()
        count += len(batch)
        print(f"Finished Comissões: {count} records.")

def migrate_produtos(connection):
    path = os.path.join(DBF_DIR, "PRODUTOS.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "produtos.dbf")
        
    print(f"\nMigrating Produtos from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO produtos (
            id_legado, descricao, fornecedor, preco_custo, preco_venda, estoque,
            quantidade_vendida, lucro, data_inicio, estoque2, duracao,
            cod_fornecedor, tipo, anotacao, usuario, data_alteracao
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    for record in dbf:
        desc = get_field_by_prefix(record, 'PO_DESCRI')
        preco_custo = get_field_by_prefix(record, 'PO_PREÇOCU') or get_field_by_prefix(record, 'PO_PRE')
        preco_venda = get_field_by_prefix(record, 'PO_PREÇOVE') or record.get('PO_PRECOVE')
        duracao = get_field_by_prefix(record, 'PO_DURA')
        anot = get_field_by_prefix(record, 'PO_ANOTA')
        
        row = (
            clean_val(record.get('PO_CODIGO')),
            clean_val(desc),
            clean_val(record.get('PO_FORNECE')),
            clean_val(preco_custo),
            clean_val(preco_venda),
            clean_val(record.get('PO_ESTOQUE')),
            clean_val(record.get('PO_QUANTVE')),
            clean_val(record.get('PO_LUCRO')),
            clean_val(record.get('PO_DATAINI')),
            clean_val(record.get('PO_ESTOQU2')),
            clean_val(duracao),
            clean_val(record.get('PO_CODFORN')),
            clean_val(record.get('PO_TIPO')),
            clean_val(anot),
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA'))
        )
        batch.append(row)
        
    with connection.cursor() as cursor:
        cursor.executemany(sql, batch)
    connection.commit()
    print(f"Finished Produtos: {len(batch)} records.")

def migrate_servicos_profissional(connection):
    path = os.path.join(DBF_DIR, "SERVIÇOS_PROFISSIONAL.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "SERVIÇOS_PROFISSIONAL.dbf")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "servicos_profissional.dbf")
        
    print(f"\nMigrating Serviços Profissional from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO servicos_profissional (
            profissional_id_legado, servico_id_legado, porcentagem, valor, usuario, data_alteracao
        ) VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    for record in dbf:
        row = (
            clean_val(record.get('PF_CODIGO')),
            clean_val(record.get('SE_CODIGO')),
            clean_val(record.get('SP_PORCENT')),
            clean_val(record.get('SP_VALOR')),
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA'))
        )
        batch.append(row)
        
    with connection.cursor() as cursor:
        cursor.executemany(sql, batch)
    connection.commit()
    print(f"Finished Serviços Profissional: {len(batch)} records.")

def migrate_caixa(connection):
    path = os.path.join(DBF_DIR, "CAIXA.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "caixa.dbf")
        
    print(f"\nMigrating Caixa from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO caixa (
            data_caixa, valor_inicial, valor_dinheiro, valor_cartao, valor_cheque,
            valor_despesa, diferenca, valor_final, cx_usuario, valor_servico,
            valor_produto, valor_chequep, vendas_dia, data_fechamento, atraso,
            usuario, data_alteracao, desconto, retirada
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    count = 0
    for record in dbf:
        cx_user = get_field_by_prefix(record, 'CX_USU')
        cx_serv = get_field_by_prefix(record, 'CX_SER')
        cx_prod = get_field_by_prefix(record, 'CX_PRO')
        cx_cheqp = get_field_by_prefix(record, 'CX_CHEQUEP')
        cx_vendasd = get_field_by_prefix(record, 'CX_VEND')
        cx_datafec = get_field_by_prefix(record, 'CX_DATAFE')
        cx_desc = get_field_by_prefix(record, 'CX_DESC')
        cx_ret = get_field_by_prefix(record, 'CX_RET')
        
        row = (
            clean_val(record.get('CX_DATA')),
            clean_val(record.get('CX_INICIAL')),
            clean_val(record.get('CX_DINHEIR')),
            clean_val(record.get('CX_CARTAO')),
            clean_val(record.get('CX_CHEQUE')),
            clean_val(record.get('CX_DESPESA')),
            clean_val(record.get('CX_DIFEREN')),
            clean_val(record.get('CX_FINAL')),
            clean_val(cx_user),
            clean_val(cx_serv),
            clean_val(cx_prod),
            clean_val(cx_cheqp),
            clean_val(cx_vendasd),
            clean_val(cx_datafec),
            clean_val(record.get('CX_ATRASO')),
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA')),
            clean_val(cx_desc),
            clean_val(cx_ret)
        )
        batch.append(row)
        if len(batch) >= BATCH_SIZE:
            with connection.cursor() as cursor:
                cursor.executemany(sql, batch)
            connection.commit()
            count += len(batch)
            print(f"Migrated {count} caixa records...")
            batch = []
            
    if batch:
        with connection.cursor() as cursor:
            cursor.executemany(sql, batch)
        connection.commit()
        count += len(batch)
        print(f"Finished Caixa: {count} records.")

def migrate_despesas(connection):
    path = os.path.join(DBF_DIR, "DESPEZAS.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "despezas.dbf")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "despesas.dbf")
        
    print(f"\nMigrating Despesas from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO despesas (
            id_legado, descricao, valor, data_despesa, anotacao, status_pago, usuario, data_alteracao
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    count = 0
    for record in dbf:
        desc = get_field_by_prefix(record, 'DE_DESCRI')
        anot = get_field_by_prefix(record, 'DE_ANOTA')
        
        row = (
            clean_val(record.get('DE_CODIGO')),
            clean_val(desc),
            clean_val(record.get('DE_VALOR')),
            clean_val(record.get('DE_DATA')),
            clean_val(anot),
            1 if record.get('DE_STATUS') else 0,
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA'))
        )
        batch.append(row)
        if len(batch) >= BATCH_SIZE:
            with connection.cursor() as cursor:
                cursor.executemany(sql, batch)
            connection.commit()
            count += len(batch)
            print(f"Migrated {count} despesas...")
            batch = []
            
    if batch:
        with connection.cursor() as cursor:
            cursor.executemany(sql, batch)
        connection.commit()
        count += len(batch)
        print(f"Finished Despesas: {count} records.")

def migrate_bandeiras(connection):
    path = os.path.join(DBF_DIR, "BANDEIRA.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "bandeira.dbf")
        
    print(f"\nMigrating Bandeiras from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO bandeiras (
            id_legado, nome, tipo, taxa, usuario, data_alteracao
        ) VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    for record in dbf:
        row = (
            clean_val(record.get('BA_CODIGO')),
            clean_val(record.get('BA_NOME')),
            clean_val(record.get('BA_TIPO')),
            clean_val(record.get('BA_TAXA')),
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA'))
        )
        batch.append(row)
        
    with connection.cursor() as cursor:
        cursor.executemany(sql, batch)
    connection.commit()
    print(f"Finished Bandeiras: {len(batch)} records.")

def migrate_atividades(connection):
    path = os.path.join(DBF_DIR, "ATIVIDADE.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "atividade.dbf")
        
    print(f"\nMigrating Atividades from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT INTO atividades (
            id_legado, nome, usuario, data_alteracao
        ) VALUES (%s, %s, %s, %s)
    """
    
    batch = []
    for record in dbf:
        row = (
            clean_val(record.get('ID_ATIVIDA')),
            clean_val(record.get('AT_NOME')),
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA'))
        )
        batch.append(row)
        
    with connection.cursor() as cursor:
        cursor.executemany(sql, batch)
    connection.commit()
    print(f"Finished Atividades: {len(batch)} records.")

def migrate_pedidos(connection):
    path = os.path.join(DBF_DIR, "PEDIDO.DBF")
    if not os.path.exists(path):
        path = os.path.join(DBF_DIR, "pedido.dbf")
        
    print(f"\nMigrating Pedidos from {path}...")
    dbf = DBF(path, encoding='cp1252', ignore_missing_memofile=True)
    
    sql = """
        INSERT IGNORE INTO pedidos (
            id_legado, cliente_id_legado, data_pedido, profissional_id_legado,
            servico_id_legado, status_pedido, usuario, data_alteracao
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    batch = []
    for record in dbf:
        row = (
            clean_val(record.get('PE_CODIGO')),
            clean_val(record.get('CL_CODIGO')),
            clean_val(record.get('PE_DATA')),
            clean_val(record.get('PF_CODIGO')),
            clean_val(record.get('SE_CODIGO')),
            1 if record.get('PE_STATUS') else 0,
            clean_val(record.get('USUARIO')),
            clean_val(record.get('ALTERA'))
        )
        batch.append(row)
        
    with connection.cursor() as cursor:
        cursor.executemany(sql, batch)
    connection.commit()
    print(f"Finished Pedidos: {len(batch)} records.")

if __name__ == "__main__":
    start_time = datetime.datetime.now()
    run_migration()
    end_time = datetime.datetime.now()
    print(f"\nMigration completed successfully in {end_time - start_time}!")
