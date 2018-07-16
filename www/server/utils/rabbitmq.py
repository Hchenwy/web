# coding: utf-8
import rabbitpy

class DevRabbitMq():
    """
    往cms队列发mq送消息类
    """
    def __init__(self, addr, queue):
        self.conn = None
        self.ch = None
        self.addr = addr
        self.queue = queue
        # self.init_mq()

    def connect(self):
        if self.conn is None:
            self.conn = rabbitpy.Connection(self.addr)
        if self.conn.STATES.get(self.conn.state) not in ('Open', 'Opening'):
            self.conn = rabbitpy.Connection(self.addr)
        return self.conn

    def close(self):
        if self.conn is not None:
            self.conn.close()

    def send_msg(self, ex, queue, msg, properties={}):
        # poroperties  can choose {
        # 'content_type',
        #  'content_encoding',
        #  'headers',
        #  'delivery_mode',
        #  'priority',
        #  'correlation_id',
        #  'reply_to',        #
        #  'expiration',
        #  'message_id',
        #  'timestamp',
        #  'message_type',
        #  'user_id',
        #  'app_id',
        #  'cluster_id']
        # }
        message = rabbitpy.Message(self.channel(), msg, properties=properties)
        message.publish(ex, queue)

    def channel(self):
        if self.ch is None:
            self.ch = self.connect().channel()
        if self.ch.STATES[self.ch.state] not in ('Open', 'Opening'):
            self.ch.close()
            self.ch = self.connect().channel()
        return self.ch
    #
    # def init_mq(self):
    #     queue = rabbitpy.Queue(self.channel(), self.queue)
    #     queue.declare()
    #     queue.bind('amq.direct', self.queue)
if __name__ == '__main__':
    addr = 'amqp://remote:remote@10.18.75.10:5672/%2F'
    queue = '1101475741123|RG-BCR860'
    dev_rabbitmq = DevRabbitMq(addr, queue)
    msg = {"event": "yyyy"}



    dev_rabbitmq.send_msg('', queue, msg , {"correlation_id":"xxxx"})
    dev_rabbitmq.close()
    # print 'eeee'